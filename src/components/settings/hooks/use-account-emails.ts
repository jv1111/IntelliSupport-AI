"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addAccountEmail,
  fetchAccountEmails,
  verifyAccountEmail,
  type AccountEmail,
} from "@/lib/auth/emails";

function upsertAccountEmail(
  currentEmails: AccountEmail[],
  nextEmail: AccountEmail,
): AccountEmail[] {
  return [
    nextEmail,
    ...currentEmails.filter((item) => item.email !== nextEmail.email),
  ];
}

export function useAccountEmails() {
  const [emails, setEmails] = useState<AccountEmail[]>([]);
  const [isEmailsLoading, setIsEmailsLoading] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    fetchAccountEmails()
      .then((items) => {
        if (isActive) {
          setEmails(items);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setEmailMessage(
            error instanceof Error
              ? error.message
              : "Unable to load email addresses.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsEmailsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const sendVerificationEmail = useCallback(async (email: string) => {
    const result = await addAccountEmail(email);

    setEmails((current) => upsertAccountEmail(current, result));

    return result;
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const verifiedEmail = await verifyAccountEmail(email, code);

    setEmails((current) => upsertAccountEmail(current, verifiedEmail));
    setEmailMessage("Email address verified successfully.");

    return verifiedEmail;
  }, []);

  const removeEmailFromList = useCallback((email: string) => {
    setEmails((current) => current.filter((item) => item.email !== email));
  }, []);

  return {
    emails,
    isEmailsLoading,
    emailMessage,
    setEmailMessage,
    sendVerificationEmail,
    verifyEmail,
    removeEmailFromList,
  };
}
