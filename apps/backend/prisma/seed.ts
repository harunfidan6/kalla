import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedMenuCatalog } from './data/seedMenuCatalog';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // 1. Clean existing data (bağımlı tablolar önce silinir — FK RESTRICT kısıtlarına uyum için)
  await prisma.posSale.deleteMany({});
  await prisma.zReport.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.walletTopup.deleteMany({});
  await prisma.loyaltyTransaction.deleteMany({});
  await prisma.staffTrainingProgress.deleteMany({});
  await prisma.trainingQuestion.deleteMany({});
  await prisma.trainingModule.deleteMany({});
  await prisma.shiftChangeRequest.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.staffProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  console.log('🧹 Eski veriler temizlendi.');

  // 1b. Create Branches (4 şube — İstanbul'un iki yakasına yayılmış, gerçek ilçe koordinatları)
  const branchKadikoy = await prisma.branch.create({
    data: { name: 'Kadıköy Şube', address: 'Caferağa Mah. Moda Cad. No:12', city: 'İstanbul', district: 'Kadıköy', latitude: 40.9903, longitude: 29.0275 },
  });
  const branchBesiktas = await prisma.branch.create({
    data: { name: 'Beşiktaş Şube', address: 'Sinanpaşa Mah. Beşiktaş Cad. No:5', city: 'İstanbul', district: 'Beşiktaş', latitude: 41.0422, longitude: 29.0061 },
  });
  const branchSisli = await prisma.branch.create({
    data: { name: 'Şişli Şube', address: 'Halaskargazi Mah. Rumeli Cad. No:45', city: 'İstanbul', district: 'Şişli', latitude: 41.0602, longitude: 28.9877 },
  });
  const branchUmraniye = await prisma.branch.create({
    data: { name: 'Ümraniye Şube', address: 'İstiklal Mah. Alemdağ Cad. No:78', city: 'İstanbul', district: 'Ümraniye', latitude: 41.0165, longitude: 29.1240 },
  });

  console.log('🏬 Şubeler oluşturuldu.');

  // 2-3. Create Categories & Products (real 102-item Källa menu + prep-step recipes)
  await seedMenuCatalog(prisma);


  // 4. Create Staff Users & Shifts
  const passwordHash = await bcrypt.hash('securePassword123', 10);

  // Bob (Barista) — Kadıköy Şube
  const bob = await prisma.user.create({
    data: {
      email: 'bob@kafe.com',
      phone: '+905559998877',
      passwordHash,
      role: 'staff',
      fullName: 'Barista Bob',
      branchId: branchKadikoy.id,
      staffProfile: {
        create: {
          position: 'Barista',
          employeeCode: 'EMP-1111',
          hireDate: new Date(),
        },
      },
    },
  });

  // Alice (Shift Lead) — Beşiktaş Şube
  const alice = await prisma.user.create({
    data: {
      email: 'alice@kafe.com',
      phone: '+905558887766',
      passwordHash,
      role: 'shift_lead',
      fullName: 'Shift Lead Alice',
      branchId: branchBesiktas.id,
      staffProfile: {
        create: {
          position: 'Shift Lead',
          employeeCode: 'EMP-2222',
          hireDate: new Date(),
        },
      },
    },
  });

  // Charlie (Admin) — şubeye bağlı değil, admin-app üzerinden tüm şubeleri yönetir
  const charlie = await prisma.user.create({
    data: {
      email: 'admin@kafe.com',
      phone: '+905557776655',
      passwordHash,
      role: 'admin',
      fullName: 'Admin Charlie',
      staffProfile: {
        create: {
          position: 'Administrator',
          employeeCode: 'EMP-3333',
          hireDate: new Date(),
        },
      },
    },
  });

  // Deniz (Barista) — Şişli Şube
  const deniz = await prisma.user.create({
    data: {
      email: 'deniz@kafe.com',
      phone: '+905556665544',
      passwordHash,
      role: 'staff',
      fullName: 'Barista Deniz',
      branchId: branchSisli.id,
      staffProfile: {
        create: {
          position: 'Barista',
          employeeCode: 'EMP-4444',
          hireDate: new Date(),
        },
      },
    },
  });

  // Ece (Barista) — Ümraniye Şube
  const ece = await prisma.user.create({
    data: {
      email: 'ece@kafe.com',
      phone: '+905553334422',
      passwordHash,
      role: 'staff',
      fullName: 'Barista Ece',
      branchId: branchUmraniye.id,
      staffProfile: {
        create: {
          position: 'Barista',
          employeeCode: 'EMP-5555',
          hireDate: new Date(),
        },
      },
    },
  });

  console.log('👥 Personel kullanıcıları oluşturuldu (her şubeye bir personel atandı).');

  // Create initial wallets
  await prisma.wallet.create({
    data: {
      userId: bob.id,
      balance: 10000, // 100 TL
    },
  });

  await prisma.wallet.create({
    data: {
      userId: alice.id,
      balance: 5000, // 50 TL
    },
  });

  await prisma.wallet.create({
    data: {
      userId: charlie.id,
      balance: 20000, // 200 TL
    },
  });

  await prisma.wallet.create({
    data: {
      userId: deniz.id,
      balance: 0,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: ece.id,
      balance: 0,
    },
  });

  // Create shifts for Bob
  const today = new Date();
  
  // Helper to create dates
  const makeDate = (offsetDays: number, hour: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  await prisma.shift.create({
    data: {
      staffId: bob.id,
      branchId: branchKadikoy.id,
      startTime: makeDate(0, 8),   // Today 08:00
      endTime: makeDate(0, 16),    // Today 16:00
      status: 'scheduled',
    },
  });

  await prisma.shift.create({
    data: {
      staffId: bob.id,
      branchId: branchKadikoy.id,
      startTime: makeDate(1, 16),  // Tomorrow 16:00
      endTime: makeDate(2, 0),     // Tomorrow midnight (next day 00:00)
      status: 'scheduled',
    },
  });

  await prisma.shift.create({
    data: {
      staffId: bob.id,
      branchId: branchKadikoy.id,
      startTime: makeDate(2, 8),   // Day after tomorrow 08:00
      endTime: makeDate(2, 16),    // Day after tomorrow 16:00
      status: 'scheduled',
    },
  });

  // Create shift for Alice
  await prisma.shift.create({
    data: {
      staffId: alice.id,
      branchId: branchBesiktas.id,
      startTime: makeDate(0, 12),  // Today 12:00
      endTime: makeDate(0, 20),    // Today 20:00
      status: 'scheduled',
    },
  });

  console.log('📅 Vardiyalar oluşturuldu.');

  // 5. Create Training Modules & Questions
  console.log('🌱 Eğitim verileri tohumlanıyor...');

  const modEspresso = await prisma.trainingModule.create({
    data: {
      title: 'Espresso Demleme Temelleri',
      category: 'Barista Eğitimi',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: 'Espresso ekstraksiyonu, öğütme ayarları, tampalama teknikleri ve barista standartları eğitimi.',
      passingScore: 80,
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modEspresso.id,
      questionText: 'Doğru bir espresso ekstraksiyon süresi ortalama kaç saniye olmalıdır?',
      options: JSON.stringify(['10-15 saniye', '25-30 saniye', '45-50 saniye', '1-2 dakika']),
      correctAnswer: '25-30 saniye',
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modEspresso.id,
      questionText: 'Double shot espresso için kaç gram kahve kullanılmalıdır?',
      options: JSON.stringify(['7-9 gram', '12-14 gram', '18-20 gram', '28-30 gram']),
      correctAnswer: '18-20 gram',
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modEspresso.id,
      questionText: 'Espresso makinesinin grup başlığı basıncı standart olarak kaç bar olmalıdır?',
      options: JSON.stringify(['3 bar', '6 bar', '9 bar', '15 bar']),
      correctAnswer: '9 bar',
    },
  });

  const modLatteArt = await prisma.trainingModule.create({
    data: {
      title: 'Süt Köpürtme ve Latte Art',
      category: 'İleri Barista',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      description: 'Mikro köpük hazırlama, süt sıcaklığı kontrolü ve temel latte art (Kalp, Lale, Rosetta) teknikleri.',
      passingScore: 80,
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modLatteArt.id,
      questionText: 'Latte art için süt köpürtülürken ideal süt sıcaklığı aralığı hangisidir?',
      options: JSON.stringify(['30-40°C', '60-65°C', '80-90°C', '100-110°C']),
      correctAnswer: '60-65°C',
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modLatteArt.id,
      questionText: 'Sütü köpürtürken oluşan ve istenmeyen büyük kabarcıklar nasıl giderilir?',
      options: JSON.stringify([
        'Sütü daha fazla kaynatarak',
        'Pitcher\'ı tezgaha hafifçe vurup dairesel hareketlerle döndürerek',
        'Sütü kaşıkla karıştırarak',
        'Süte soğuk su ekleyerek'
      ]),
      correctAnswer: 'Pitcher\'ı tezgaha hafifçe vurup dairesel hareketlerle döndürerek',
    },
  });

  await prisma.trainingQuestion.create({
    data: {
      moduleId: modLatteArt.id,
      questionText: 'Rosetta deseni çizilirken pitcher ile bardağa yapılan temel hareket hangisidir?',
      options: JSON.stringify([
        'Yukarı aşağı hızlı vuruşlar',
        'Yatay zigzag sallama hareketi',
        'Bardağı sürekli çevirme',
        'Sütü çok yüksekten dökme'
      ]),
      correctAnswer: 'Yatay zigzag sallama hareketi',
    },
  });

  console.log('🎓 Eğitim modülleri ve quiz soruları oluşturuldu.');
  console.log('🎉 Seed işlemi başarıyla tamamlandı!');
}

main()
  .catch((e) => {
    console.error('❌ Seed işleminde hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
