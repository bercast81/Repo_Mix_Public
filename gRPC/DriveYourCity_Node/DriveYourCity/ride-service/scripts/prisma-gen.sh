cp -f ./../database/prisma/schema.prisma ./../ride-service/schema.prisma
npx prisma generate --schema ./schema.prisma
rm ./../ride-service/schema.prisma