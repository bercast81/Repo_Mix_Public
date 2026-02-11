cp -f ./../database/prisma/schema.prisma ./../dock-service/schema.prisma
npx prisma generate --schema ./schema.prisma
rm ./../dock-service/schema.prisma