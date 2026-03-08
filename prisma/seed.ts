import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ── Regions (iller) ──────────────────────
  console.log("Creating regions...");
  const turkey = await prisma.region.upsert({
    where: { code: "TR" },
    update: {},
    create: {
      name: "Turkiye",
      code: "TR",
      type: "COUNTRY",
      country: "Turkiye",
      population: 85370000,
      registeredVoters: 64000000,
    },
  });

  const provinces = await Promise.all([
    prisma.region.upsert({
      where: { code: "TR-34" },
      update: {},
      create: { name: "Istanbul", code: "TR-34", type: "PROVINCE", country: "Turkiye", parentId: turkey.id, population: 15840000, registeredVoters: 11200000 },
    }),
    prisma.region.upsert({
      where: { code: "TR-06" },
      update: {},
      create: { name: "Ankara", code: "TR-06", type: "PROVINCE", country: "Turkiye", parentId: turkey.id, population: 5747000, registeredVoters: 4100000 },
    }),
    prisma.region.upsert({
      where: { code: "TR-35" },
      update: {},
      create: { name: "Izmir", code: "TR-35", type: "PROVINCE", country: "Turkiye", parentId: turkey.id, population: 4426000, registeredVoters: 3200000 },
    }),
    prisma.region.upsert({
      where: { code: "TR-16" },
      update: {},
      create: { name: "Bursa", code: "TR-16", type: "PROVINCE", country: "Turkiye", parentId: turkey.id, population: 3147000, registeredVoters: 2200000 },
    }),
    prisma.region.upsert({
      where: { code: "TR-01" },
      update: {},
      create: { name: "Adana", code: "TR-01", type: "PROVINCE", country: "Turkiye", parentId: turkey.id, population: 2270000, registeredVoters: 1550000 },
    }),
  ]);

  console.log(`  Created ${provinces.length + 1} regions`);

  // ── Parties ──────────────────────────────
  console.log("Creating parties...");
  const [akp, chp, mhp, iyi, dem] = await Promise.all([
    prisma.party.upsert({
      where: { slug: "akp" },
      update: {},
      create: {
        name: "Adalet ve Kalkinma Partisi",
        abbreviation: "AKP",
        slug: "akp",
        country: "Turkiye",
        color: "#FFA500",
        ideology: "Muhafazakar",
        founded: 2001,
        leaderName: "Recep Tayyip Erdogan",
      },
    }),
    prisma.party.upsert({
      where: { slug: "chp" },
      update: {},
      create: {
        name: "Cumhuriyet Halk Partisi",
        abbreviation: "CHP",
        slug: "chp",
        country: "Turkiye",
        color: "#FF0000",
        ideology: "Sosyal Demokrat",
        founded: 1923,
        leaderName: "Ozgur Ozel",
      },
    }),
    prisma.party.upsert({
      where: { slug: "mhp" },
      update: {},
      create: {
        name: "Milliyetci Hareket Partisi",
        abbreviation: "MHP",
        slug: "mhp",
        country: "Turkiye",
        color: "#CC0000",
        ideology: "Milliyetci",
        founded: 1969,
        leaderName: "Devlet Bahceli",
      },
    }),
    prisma.party.upsert({
      where: { slug: "iyi" },
      update: {},
      create: {
        name: "IYI Parti",
        abbreviation: "IYI",
        slug: "iyi",
        country: "Turkiye",
        color: "#0099CC",
        ideology: "Merkez Sag",
        founded: 2017,
      },
    }),
    prisma.party.upsert({
      where: { slug: "dem" },
      update: {},
      create: {
        name: "Halklarin Esitlik ve Demokrasi Partisi",
        abbreviation: "DEM",
        slug: "dem",
        country: "Turkiye",
        color: "#800080",
        ideology: "Sol",
        founded: 2024,
      },
    }),
  ]);

  console.log("  Created 5 parties");

  // ── Poll Firms ───────────────────────────
  console.log("Creating poll firms...");
  const [konda, metropoll, optimar] = await Promise.all([
    prisma.pollFirm.upsert({
      where: { slug: "konda" },
      update: {},
      create: {
        name: "KONDA Arastirma",
        slug: "konda",
        country: "Turkiye",
        website: "https://konda.com.tr",
        methodology: "CAPI (Yuz yuze gorusme)",
        accuracyScore: 82.5,
        totalPolls: 340,
      },
    }),
    prisma.pollFirm.upsert({
      where: { slug: "metropoll" },
      update: {},
      create: {
        name: "MetroPOLL Stratejik",
        slug: "metropoll",
        country: "Turkiye",
        website: "https://metropoll.com.tr",
        methodology: "CATI (Telefon anketi)",
        accuracyScore: 78.0,
        totalPolls: 280,
      },
    }),
    prisma.pollFirm.upsert({
      where: { slug: "optimar" },
      update: {},
      create: {
        name: "OPTİMAR Arastirma",
        slug: "optimar",
        country: "Turkiye",
        methodology: "CATI + Online Panel",
        accuracyScore: 74.5,
        totalPolls: 210,
      },
    }),
  ]);

  console.log("  Created 3 poll firms");

  // ── Sample Election ──────────────────────
  console.log("Creating election...");
  const election = await prisma.election.upsert({
    where: { slug: "2028-genel-secim" },
    update: {},
    create: {
      title: "2028 Turkiye Genel Secimi",
      slug: "2028-genel-secim",
      description: "Turkiye Buyuk Millet Meclisi 29. Donem milletvekili genel secimi.",
      type: "PARLIAMENTARY",
      status: "UPCOMING",
      country: "Turkiye",
      date: new Date("2028-06-18"),
      regionId: turkey.id,
    },
  });

  console.log(`  Created election: ${election.title}`);

  // ── Link parties to election ─────────────
  const partyList = [akp, chp, mhp, iyi, dem];
  const alliances = ["Cumhur Ittifaki", "Ana Muhalefet", "Cumhur Ittifaki", null, null];

  for (let i = 0; i < partyList.length; i++) {
    const party = partyList[i]!;
    await prisma.electionParty.upsert({
      where: {
        electionId_partyId: {
          electionId: election.id,
          partyId: party.id,
        },
      },
      update: {},
      create: {
        electionId: election.id,
        partyId: party.id,
        alliance: alliances[i],
        listOrder: i + 1,
      },
    });
  }

  console.log("  Linked 5 parties to election");

  // ── Sample Poll Results ──────────────────
  console.log("Creating poll results...");

  const pollData = [
    { firm: konda, date: "2026-03-01", akp: 32.1, chp: 30.5, mhp: 9.8, iyi: 8.2, dem: 11.5 },
    { firm: metropoll, date: "2026-02-15", akp: 31.5, chp: 31.0, mhp: 10.2, iyi: 7.8, dem: 11.0 },
    { firm: optimar, date: "2026-02-01", akp: 33.0, chp: 29.5, mhp: 10.5, iyi: 8.5, dem: 10.8 },
  ];

  for (const poll of pollData) {
    const partyPercentages = [
      { party: akp, pct: poll.akp },
      { party: chp, pct: poll.chp },
      { party: mhp, pct: poll.mhp },
      { party: iyi, pct: poll.iyi },
      { party: dem, pct: poll.dem },
    ];

    for (const { party, pct } of partyPercentages) {
      await prisma.pollResult.create({
        data: {
          electionId: election.id,
          pollFirmId: poll.firm.id,
          partyId: party.id,
          percentage: pct,
          sampleSize: 2400,
          marginOfError: 2.0,
          publishedAt: new Date(poll.date),
          reliabilityScore: (poll.firm.accuracyScore ?? 75) / 100,
        },
      });
    }
  }

  console.log("  Created 15 poll results (3 firms x 5 parties)");

  // ── Sample Predictions ───────────────────
  console.log("Creating predictions...");

  const predictionData = [
    { party: akp, low: 29.5, mid: 32.0, high: 34.5 },
    { party: chp, low: 28.0, mid: 30.5, high: 33.0 },
    { party: mhp, low: 8.5, mid: 10.0, high: 11.5 },
    { party: iyi, low: 6.5, mid: 8.0, high: 9.5 },
    { party: dem, low: 9.5, mid: 11.0, high: 12.5 },
  ];

  for (const pred of predictionData) {
    await prisma.prediction.create({
      data: {
        electionId: election.id,
        partyId: pred.party.id,
        low: pred.low,
        mid: pred.mid,
        high: pred.high,
        confidence: 0.85,
        status: "PUBLISHED",
        reasoning: `Anket ortalamalari ve gecmis secim trendlerine dayali sistem tahmini. ${pred.party.abbreviation} icin %${pred.low}-%${pred.high} guven araligi.`,
      },
    });
  }

  console.log("  Created 5 system predictions");

  // ── Data Source ──────────────────────────
  console.log("Creating data source...");
  await prisma.dataSource.create({
    data: {
      name: "KONDA Mart 2026 Secim Anketi",
      url: "https://konda.com.tr/rapor/mart-2026-secim-anketi",
      electionId: election.id,
      verification: "VERIFIED",
      fetchedAt: new Date(),
      httpStatus: 200,
      notes: "Seed data - ornek veri kaynagi",
    },
  });

  console.log("  Created 1 data source");

  console.log("\nSeeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
