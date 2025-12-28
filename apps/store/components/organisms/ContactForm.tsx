"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { api } from "@/lib/api";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const { error: apiError } = await api.contact.post(data);

    setIsSubmitting(false);

    if (apiError) {
      setError(
        apiError.value && typeof apiError.value === "object" && "message" in apiError.value
          ? (apiError.value as { message: string }).message
          : "Une erreur est survenue. Veuillez réessayer."
      );
      return;
    }

    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mb-4 text-2xl font-bold">Message envoyé</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Merci pour votre message. Nous vous répondrons dans les plus brefs
          délais.
        </p>
        <Button
          variant="secondary"
          className="mt-8"
          onClick={() => setIsSubmitted(false)}
        >
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nom"
          name="name"
          type="text"
          required
          placeholder="Votre nom"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
        />

        <Input
          label="Sujet"
          name="subject"
          type="text"
          required
          placeholder="Sujet de votre message"
        />

        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            placeholder="Votre message..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
          />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Envoyer le message
        </Button>
      </form>
    </>
  );
}
