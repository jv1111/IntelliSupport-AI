"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addAccountPhone,
  deleteAccountPhone,
  fetchAccountPhones,
  verifyAccountPhone,
  type AccountPhone,
} from "@/lib/auth/phones";

function upsertAccountPhone(
  currentPhones: AccountPhone[],
  nextPhone: AccountPhone,
): AccountPhone[] {
  return [
    nextPhone,
    ...currentPhones.filter((item) => item.phone !== nextPhone.phone),
  ];
}

export function useAccountPhones() {
  const [phones, setPhones] = useState<AccountPhone[]>([]);
  const [isPhonesLoading, setIsPhonesLoading] = useState(true);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [deletingPhoneId, setDeletingPhoneId] = useState<string | null>(null);
  const [phoneDeletionError, setPhoneDeletionError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isActive = true;

    fetchAccountPhones()
      .then((items) => {
        if (isActive) {
          setPhones(items);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setPhoneMessage(
            error instanceof Error
              ? error.message
              : "Unable to load phone numbers.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsPhonesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const sendVerificationPhone = useCallback(async (phone: string) => {
    const result = await addAccountPhone(phone);

    setPhones((current) => upsertAccountPhone(current, result));

    return result;
  }, []);

  const verifyPhone = useCallback(async (phone: string, code: string) => {
    const verifiedPhone = await verifyAccountPhone(phone, code);

    setPhones((current) => upsertAccountPhone(current, verifiedPhone));
    setPhoneMessage("Phone number verified successfully.");

    return verifiedPhone;
  }, []);

  const deletePhone = useCallback(async (phoneId: string): Promise<boolean> => {
    setDeletingPhoneId(phoneId);
    setPhoneDeletionError(null);

    try {
      await deleteAccountPhone(phoneId);
      setPhones((current) => current.filter((item) => item.id !== phoneId));

      return true;
    } catch (error) {
      setPhoneDeletionError(
        error instanceof Error
          ? error.message
          : "Unable to delete phone number. Please try again.",
      );

      return false;
    } finally {
      setDeletingPhoneId(null);
    }
  }, []);

  const clearPhoneDeletionError = useCallback(() => {
    setPhoneDeletionError(null);
  }, []);

  return {
    phones,
    isPhonesLoading,
    phoneMessage,
    setPhoneMessage,
    sendVerificationPhone,
    verifyPhone,
    deletePhone,
    deletingPhoneId,
    phoneDeletionError,
    clearPhoneDeletionError,
  };
}
