"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Form, Formik, type FormikHelpers } from "formik";
import { KeyRound, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PasswordFormikInput } from "@/components/ui/password-formik-input";
import { FieldLabel } from "@/components/ui/field";
import { InlineBadge } from "@/components/ui/inline-badge";
import { Input } from "@/components/ui/input";
import { SuccessBadge } from "@/components/ui/success-badge";
import { VerificationDialog } from "@/components/settings/verification-dialog";
import { StatusDialog } from "@/components/ui/status-dialog";
import { useAccountSettings } from "@/components/settings/hooks/use-account-settings";
import {
  validateChangePassword,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";

const initialPasswordValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

type VerificationTarget = {
  method: "email" | "phone";
  destination: string;
} | null;

interface AccountSettingsProps {
  username: string;
  createdAt: Date;
}

export function AccountSettings({ username, createdAt }: AccountSettingsProps) {
  const { passwordDialog, changePassword, closePasswordDialog } =
    useAccountSettings();

  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [verificationTarget, setVerificationTarget] =
    useState<VerificationTarget>(null);

  const handleCloseVerificationDialog = useCallback(() => {
    setVerificationTarget(null);
  }, []);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const initial = username.slice(0, 1).toUpperCase() || "U";

  const memberSince = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(createdAt);

  const accountDetails = [
    {
      label: "Username",
      value: username,
      description: "Your account identifier.",
    },
    {
      label: "Member since",
      value: memberSince,
      description: "When your account was created.",
    },
  ];

  function handleAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = email.trim().toLowerCase();

    if (emails.includes(value)) {
      setEmailMessage("This email address has already been added.");
      return;
    }

    setEmails((current) => [...current, value]);
    setEmail("");
    setEmailMessage("Email added to this page preview.");
  }

  function handleAddPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = phone.trim();
    const digits = value.replace(/\D/g, "");

    if (
      !/^\+?[0-9\s().-]+$/.test(value) ||
      digits.length < 7 ||
      digits.length > 15
    ) {
      setPhoneMessage("Enter a valid phone number with 7 to 15 digits.");
      return;
    }

    if (phones.some((item) => item.replace(/\D/g, "") === digits)) {
      setPhoneMessage("This phone number has already been added.");
      return;
    }

    setPhones((current) => [...current, value]);
    setPhone("");
    setPhoneMessage("Phone number added to this page preview.");
  }

  async function handleChangePassword(
    values: ChangePasswordFormValues,
    {
      resetForm,
      setStatus,
      setFieldError,
      setFieldTouched,
    }: FormikHelpers<ChangePasswordFormValues>,
  ): Promise<void> {
    setStatus(undefined);

    if (
      values.currentPassword === "" &&
      values.newPassword === "" &&
      values.confirmPassword === ""
    ) {
      setStatus({
        message: "Enter your current password and a new password to continue.",
      });
      return;
    }

    const result = await changePassword(values);

    if (result.success) {
      resetForm();
      return;
    }

    if (result.code === "INVALID_CURRENT_PASSWORD") {
      setFieldError("currentPassword", "Your current password is incorrect.");
      await setFieldTouched("currentPassword", true, false);
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl space-y-8 p-5 sm:p-8 lg:p-10">
        <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary text-xl font-bold text-primary-foreground shadow-md shadow-primary/15">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Account
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Account settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account details and sign-in security.
            </p>
          </div>

          <SuccessBadge label="Session active" />
        </header>

        <section className="grid gap-4 border-b border-border pb-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Profile information
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your account identity and registration details.
            </p>
          </div>

          <Card className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 border-b border-border pb-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {username}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  IntelliSupport account
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {accountDetails.map((detail) => (
                <div key={detail.label} className="min-w-0 space-y-2">
                  <p className="text-xs font-bold text-foreground">
                    {detail.label}
                  </p>

                  <div className="flex min-h-12 items-center rounded-xl border border-border bg-surface-muted px-4">
                    <span className="truncate text-sm font-medium text-foreground">
                      {detail.value}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 border-b border-border pb-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Email addresses
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add email addresses associated with your account.
            </p>
          </div>

          <Card className="space-y-5 p-5 sm:p-6">
            {emails.length > 0 ? (
              <ul className="space-y-2">
                {emails.map((item) => (
                  <li
                    key={item}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-3"
                  >
                    <Mail
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {item}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <InlineBadge variant="warning">Unverified</InlineBadge>
                      <Button
                        variant="text"
                        type="button"
                        onClick={() =>
                          setVerificationTarget({
                            method: "email",
                            destination: item,
                          })
                        }
                      >
                        Verify
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Mail}
                title="No email addresses added yet"
                description="Your additional email addresses will appear here."
              />
            )}

            <form onSubmit={handleAddEmail} className="space-y-3">
              <div>
                <FieldLabel htmlFor="account-email" required>
                  Add an email address
                </FieldLabel>
                <Input
                  id="account-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailMessage("");
                  }}
                  required
                  className="px-3.5 py-2.5"
                />
              </div>

              {emailMessage && (
                <p role="status" className="text-xs text-muted-foreground">
                  {emailMessage}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" fullWidth={false} className="gap-2">
                  <Mail className="size-4" aria-hidden="true" />
                  Add Email
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="grid gap-4 border-b border-border pb-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Phone numbers
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add phone numbers associated with your account.
            </p>
          </div>

          <Card className="space-y-5 p-5 sm:p-6">
            {phones.length > 0 ? (
              <ul className="space-y-2">
                {phones.map((item) => (
                  <li
                    key={item}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-3"
                  >
                    <Phone
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {item}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <InlineBadge variant="warning">Unverified</InlineBadge>
                      <Button
                        variant="text"
                        type="button"
                        onClick={() =>
                          setVerificationTarget({
                            method: "phone",
                            destination: item,
                          })
                        }
                      >
                        Verify
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Phone}
                title="No phone numbers added yet"
                description="Your additional phone numbers will appear here."
              />
            )}

            <form onSubmit={handleAddPhone} className="space-y-3">
              <div>
                <FieldLabel htmlFor="account-phone" required>
                  Add a phone number
                </FieldLabel>
                <Input
                  id="account-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+Country code and phone number"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setPhoneMessage("");
                  }}
                  required
                  className="px-3.5 py-2.5"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Include your country code.
                </p>
              </div>

              {phoneMessage && (
                <p role="status" className="text-xs text-muted-foreground">
                  {phoneMessage}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" fullWidth={false} className="gap-2">
                  <Phone className="size-4" aria-hidden="true" />
                  Add Phone Number
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Sign-in security
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Information about your account authentication.
            </p>
          </div>

          <Card className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Password authentication
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Your account uses password-based authentication.
                  </p>
                </div>
              </div>

              <SuccessBadge label="Enabled" />
            </div>

            <div className="rounded-xl border border-border bg-surface-muted/60 p-4">
              <div className="flex items-center gap-2">
                <KeyRound
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-xs font-bold text-foreground">
                  Password management
                </p>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Verify your current password before setting a new sign-in
                password for your account.
              </p>
            </div>

            <Formik
              initialValues={initialPasswordValues}
              validate={validateChangePassword}
              onSubmit={handleChangePassword}
            >
              {({ status, isSubmitting }) => {
                const feedback = status as { message: string } | undefined;

                return (
                  <Form className="space-y-4" noValidate>
                    <PasswordFormikInput
                      name="currentPassword"
                      label="Current password"
                      autoComplete="current-password"
                      placeholder="Enter your current password"
                      leadingIcon={Lock}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <PasswordFormikInput
                        name="newPassword"
                        label="New password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        leadingIcon={Lock}
                      />

                      <PasswordFormikInput
                        name="confirmPassword"
                        label="Confirm new password"
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        leadingIcon={Lock}
                      />
                    </div>

                    {feedback?.message && (
                      <p
                        role="status"
                        className="text-xs text-muted-foreground"
                      >
                        {feedback.message}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        fullWidth={false}
                        disabled={isSubmitting}
                      >
                        Update Password
                      </Button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </Card>
        </section>
      </main>

      <VerificationDialog
        open={verificationTarget !== null}
        method={verificationTarget?.method ?? "email"}
        destination={verificationTarget?.destination ?? ""}
        onClose={handleCloseVerificationDialog}
      />

      <StatusDialog
        open={passwordDialog !== null}
        status={passwordDialog?.status ?? "loading"}
        title={passwordDialog?.title ?? ""}
        message={passwordDialog?.message ?? ""}
        actionLabel={passwordDialog?.actionLabel ?? "Close"}
        onClose={closePasswordDialog}
      />
    </>
  );
}
