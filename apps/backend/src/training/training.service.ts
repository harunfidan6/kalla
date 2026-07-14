import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  async findAllModules(staffId: string) {
    const modules = await this.prisma.trainingModule.findMany({
      include: {
        questions: {
          select: { id: true },
        },
      },
    });

    const staffProgress = await this.prisma.staffTrainingProgress.findMany({
      where: { staffId },
    });

    return modules.map((mod) => {
      const progress = staffProgress.find((p) => p.moduleId === mod.id);
      return {
        id: mod.id,
        title: mod.title,
        category: mod.category,
        description: mod.description,
        videoUrl: mod.videoUrl,
        passingScore: mod.passingScore,
        totalQuestions: mod.questions.length,
        progress: progress
          ? {
              status: progress.status,
              quizScore: progress.quizScore,
              certificateUrl: progress.certificateUrl,
              completedAt: progress.completedAt,
            }
          : null,
      };
    });
  }

  async findOneModule(moduleId: string) {
    const mod = await this.prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
          },
        },
      },
    });

    if (!mod) {
      throw new NotFoundException('Eğitim modülü bulunamadı');
    }

    return mod;
  }

  async submitQuiz(staffId: string, moduleId: string, dto: SubmitQuizDto) {
    const { answers } = dto;

    const mod = await this.prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: { questions: true },
    });

    if (!mod) {
      throw new NotFoundException('Eğitim modülü bulunamadı');
    }

    const totalQuestions = mod.questions.length;
    if (totalQuestions === 0) {
      throw new BadRequestException('Bu modülde quiz bulunmuyor');
    }

    let correctCount = 0;

    mod.questions.forEach((q) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      if (
        userAnswer &&
        userAnswer.selectedOption.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        correctCount++;
      }
    });

    const quizScore = Math.round((correctCount / totalQuestions) * 100);
    const passed = quizScore >= mod.passingScore;

    const existingProgress = await this.prisma.staffTrainingProgress.findUnique({
      where: {
        staffId_moduleId: { staffId, moduleId },
      },
    });

    let certificateUrl = existingProgress?.certificateUrl || null;

    if (passed && !certificateUrl) {
      certificateUrl = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const progressStatus = passed ? 'completed' : 'in_progress';

    await this.prisma.staffTrainingProgress.upsert({
      where: {
        staffId_moduleId: { staffId, moduleId },
      },
      create: {
        staffId,
        moduleId,
        status: progressStatus,
        quizScore,
        certificateUrl,
        completedAt: passed ? new Date() : null,
      },
      update: {
        status: progressStatus,
        quizScore,
        certificateUrl,
        completedAt: passed ? new Date() : null,
      },
    });

    return {
      score: quizScore,
      passed,
      correctCount,
      totalCount: totalQuestions,
      certificateCode: certificateUrl,
    };
  }
}
