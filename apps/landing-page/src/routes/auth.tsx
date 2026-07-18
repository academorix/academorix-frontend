import { useState } from "react";

import { Button, FieldError, Form, Input, InputGroup, Label, TextField } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { BrandIsotipo } from "../brand";
import { useI18n } from "../i18n";
import { Iconify } from "../icons/iconify";

export function CreateWorkspaceRoute() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <BrandIsotipo className="text-accent" height={48} width={48} />

      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {t("auth.create.headline")}
        </h1>
        <p className="text-sm text-muted">{t("auth.create.subheadline")}</p>
      </div>

      <Form className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-4">
          <TextField isRequired name="name">
            <Label>{t("auth.create.name")}</Label>
            <Input placeholder={t("auth.create.namePlaceholder")} />
            <FieldError />
          </TextField>

          <TextField isRequired name="email" type="email">
            <Label>{t("auth.create.emailLabel")}</Label>
            <Input placeholder={t("auth.create.emailPlaceholder")} />
            <FieldError />
          </TextField>

          <TextField isRequired name="workspace">
            <Label>{t("auth.create.workspaceLabel")}</Label>
            <InputGroup className="w-full">
              <InputGroup.Input
                className="w-full"
                placeholder={t("auth.create.workspaceInputPlaceholder")}
              />
              <InputGroup.Suffix className="text-muted">
                {t("auth.create.workspaceSuffix")}
              </InputGroup.Suffix>
            </InputGroup>
            <FieldError />
          </TextField>

          <TextField isRequired minLength={8} name="password">
            <Label>{t("auth.create.password")}</Label>
            <InputGroup className="w-full">
              <InputGroup.Input
                className="w-full"
                placeholder={t("auth.create.passwordPlaceholder")}
                type={isVisible ? "text" : "password"}
              />
              <InputGroup.Suffix className="pr-0">
                <Button
                  aria-label={
                    isVisible ? t("auth.create.hidePassword") : t("auth.create.showPassword")
                  }
                  isIconOnly
                  onPress={() => setIsVisible((prev) => !prev)}
                  size="sm"
                  variant="ghost"
                >
                  <Iconify className="size-4" icon={isVisible ? "eye-slash" : "eye"} />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
            <FieldError />
          </TextField>
        </div>

        <Button fullWidth type="submit" variant="primary">
          {t("auth.create.submitLabel")}
          <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
        </Button>
      </Form>

      <p className="text-sm text-muted">
        {t("auth.create.haveWorkspace")}{" "}
        <RouterLink className="link font-semibold text-foreground" to="/find-workspaces">
          {t("auth.create.signInLink")}
        </RouterLink>
      </p>
    </div>
  );
}

export function FindWorkspacesRoute() {
  const { t } = useI18n();

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <BrandIsotipo className="text-accent" height={48} width={48} />

      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {t("auth.find.headline")}
        </h1>
        <p className="text-sm text-muted">{t("auth.find.subheadline")}</p>
      </div>

      <Form className="flex w-full flex-col gap-5">
        <TextField isRequired name="email" type="email">
          <Label>{t("auth.find.emailLabel")}</Label>
          <Input placeholder={t("auth.create.emailPlaceholder")} />
          <FieldError />
        </TextField>

        <Button fullWidth type="submit" variant="primary">
          {t("auth.find.continue")}
          <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
        </Button>
      </Form>

      <p className="text-sm text-muted">
        {t("auth.find.noWorkspace")}{" "}
        <RouterLink className="link font-semibold text-foreground" to="/create-workspace">
          {t("auth.find.createOneLink")}
        </RouterLink>
      </p>
    </div>
  );
}
