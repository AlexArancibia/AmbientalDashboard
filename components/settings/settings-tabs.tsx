"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanySettings } from "@/components/settings/company-settings"
import { BankAccountSettings } from "@/components/settings/bank-account-settings"

export function SettingsTabs() {
  return (
    <Tabs defaultValue="company" className="space-y-4">
      <TabsList>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
      </TabsList>
      <TabsContent value="company">
        <CompanySettings />
      </TabsContent>
      <TabsContent value="bank-accounts">
        <BankAccountSettings />
      </TabsContent>
    </Tabs>
  )
}

