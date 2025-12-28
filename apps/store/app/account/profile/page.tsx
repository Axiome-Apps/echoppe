"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";

export default function ProfilePage() {
  const { customer } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Mon profil
      </h2>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <Input
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={customer?.email ?? ""}
            disabled
          />

          <Input
            label="Téléphone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
          />

          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <Button type="submit">Enregistrer</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: customer?.firstName ?? "",
                      lastName: customer?.lastName ?? "",
                      phone: customer?.phone ?? "",
                    });
                  }}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Email preferences */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="font-medium text-zinc-900 dark:text-white">
          Préférences email
        </h3>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={customer?.marketingOptin ?? false}
            disabled
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Recevoir les offres et actualités par email
          </span>
        </label>
      </div>
    </div>
  );
}
