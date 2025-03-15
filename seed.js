// seed.js

const { PrismaClient } = require('./dist/prisma')
const prisma = new PrismaClient()

async function seed() {
  try {
    // Create counties first
    const counties = require('./assets/locations.json')
    const wards = require('./assets/wards.json')
    for (const county of counties) {
      const createdCounty = await prisma.county.create({
        data: {
          code: county.number,
          name: county.name,
          capital: county.capital,
          // Create subcounties for this county
          subCounties: {
            create: county.constituencies.map(subCounty => ({
              code: subCounty.code,
              name: subCounty.name,
              // Create wards for this subcounty
              wards: {
                create: wards.filter((ward)=>`${ward.constituency_code}` === subCounty.code).map(ward => ({
                  code: `${ward.code}`,
                  name: ward.name,
                  countyCode: county.number,
                }))
              }
            }))
          }
        }
      })
      console.log(`Created county: ${createdCounty.name}`)
    }
    console.log('Database seeding completed')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()