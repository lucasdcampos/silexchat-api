-- CreateTable
CREATE TABLE "HiddenConversation" (
    "hidingUserId" INTEGER NOT NULL,
    "partnerId" INTEGER NOT NULL,

    CONSTRAINT "HiddenConversation_pkey" PRIMARY KEY ("hidingUserId","partnerId")
);

-- AddForeignKey
ALTER TABLE "HiddenConversation" ADD CONSTRAINT "HiddenConversation_hidingUserId_fkey" FOREIGN KEY ("hidingUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
