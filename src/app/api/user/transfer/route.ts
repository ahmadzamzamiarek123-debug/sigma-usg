import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { transferSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

// POST /api/user/transfer - Transfer saldo ke user lain
export async function POST(request: NextRequest) {
  const { error, user } = await withAuth("USER");

  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const validation = transferSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { toNim, amount, pin, message } = validation.data;

    // Cannot transfer to self
    if (toNim === user!.identifier) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat transfer ke diri sendiri" },
        { status: 400 }
      );
    }

    // Get sender data with PIN
    const sender = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { balance: true },
    });

    if (!sender || !sender.pinHash) {
      return NextResponse.json(
        { success: false, error: "PIN belum diatur" },
        { status: 400 }
      );
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, sender.pinHash);
    if (!isPinValid) {
      return NextResponse.json(
        { success: false, error: "PIN salah" },
        { status: 401 }
      );
    }

    // Get current balance
    const senderBalance = sender.balance?.balance || 0;
    if (senderBalance < amount) {
      return NextResponse.json(
        { success: false, error: "Saldo tidak mencukupi" },
        { status: 400 }
      );
    }

    // Find recipient
    const recipient = await prisma.user.findFirst({
      where: {
        identifier: toNim,
        role: "USER",
      },
      include: { balance: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "NIM tujuan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Execute transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const newSenderBalance = senderBalance - amount;
      await tx.balance.update({
        where: { userId: sender.id },
        data: { balance: newSenderBalance },
      });

      // Add to recipient (create balance if not exists)
      const recipientBalance = recipient.balance?.balance || 0;
      const newRecipientBalance = recipientBalance + amount;

      if (recipient.balance) {
        await tx.balance.update({
          where: { userId: recipient.id },
          data: { balance: newRecipientBalance },
        });
      } else {
        await tx.balance.create({
          data: {
            userId: recipient.id,
            balance: newRecipientBalance,
          },
        });
      }

      // Create transaction records
      const senderTransaction = await tx.transaction.create({
        data: {
          userId: sender.id,
          type: "TRANSFER_OUT",
          amount,
          balanceBefore: senderBalance,
          balanceAfter: newSenderBalance,
          description: `Transfer ke ${recipient.name}${
            message ? ": " + message : ""
          }`,
          relatedUserId: recipient.id,
          createdBy: sender.id,
        },
      });

      await tx.transaction.create({
        data: {
          userId: recipient.id,
          type: "TRANSFER_IN",
          amount,
          balanceBefore: recipientBalance,
          balanceAfter: newRecipientBalance,
          description: `Transfer dari ${sender.name}${
            message ? ": " + message : ""
          }`,
          relatedUserId: sender.id,
          createdBy: sender.id,
        },
      });

      return {
        transaction: senderTransaction,
        newBalance: newSenderBalance,
      };
    });

    // Audit log
    await createAuditLog(sender.id, "TRANSFER_SENT", {
      targetUserId: recipient.id,
      targetUserName: recipient.name,
      amount,
    });

    return NextResponse.json({
      success: true,
      message: `Transfer Rp ${amount.toLocaleString("id-ID")} ke ${
        recipient.name
      } berhasil`,
      data: {
        transactionId: result.transaction.id,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Error processing transfer:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
