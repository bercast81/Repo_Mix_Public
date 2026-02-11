cp -f ./../database/prisma/schema.prisma ./../bike-service/schema.prisma
npx prisma generate --schema ./schema.prisma
rm ./../bike-service/schema.prisma