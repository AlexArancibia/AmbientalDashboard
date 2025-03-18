"use client"

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { type Quotation, Currency } from "@/types"

// Register fonts
Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
})

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Inter",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 80,
    marginRight: 20,
    objectFit: "contain",
  },
  headerInfo: {
    flex: 1,
  },
  quotationNumber: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1a1a1a",
  },
  companyInfo: {
    marginBottom: 3,
    color: "#4b5563",
  },
  clientSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  columnHeader: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  column: {
    flex: 1,
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
    color: "#4b5563",
  },
  totalValue: {
    width: 100,
    textAlign: "right",
  },
  grandTotal: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#1f2937",
  },
  footer: {
    marginTop: 30,
    fontSize: 8,
    color: "#6b7280",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: "bold",
    color: "#4b5563",
  },
  infoValue: {
    flex: 1,
  },
})

interface QuotationPDFProps {
  quotation: Quotation
}

export function QuotationPDF({ quotation }: QuotationPDFProps) {
  const formatCurrency = (amount: number) => {
    return `${quotation.currency === Currency.PEN ? "S/ " : "$ "}${amount.toFixed(2)}`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerInfo}>
            <Text style={styles.quotationNumber}>COTIZACIÓN Nº {quotation.number}</Text>
            <Text style={styles.companyInfo}>SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786</Text>
            <Text style={styles.companyInfo}>Jr. San Martin 1582 - PN</Text>
            <Text style={styles.companyInfo}>ventas@ambientalpe.com</Text>
            <Text style={styles.companyInfo}>Tf:019004785 Cel. 921899874</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CLIENTE:</Text>
            <Text style={styles.infoValue}>{quotation.client.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RUC:</Text>
            <Text style={styles.infoValue}>{quotation.client.ruc}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DIRECCIÓN:</Text>
            <Text style={styles.infoValue}>{quotation.client.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL:</Text>
            <Text style={styles.infoValue}>{quotation.client.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ATENCIÓN:</Text>
            <Text style={styles.infoValue}>{quotation.client.contactPerson || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LÍNEA DE CRÉDITO:</Text>
            <Text style={styles.infoValue}>
              {quotation.client.creditLine ? formatCurrency(quotation.client.creditLine) : "-"}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>DETALLE DE SERVICIOS</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.column, styles.columnHeader, { flex: 0.5 }]}>CANT</Text>
            <Text style={[styles.column, styles.columnHeader, { flex: 0.5 }]}>DÍAS</Text>
            <Text style={[styles.column, styles.columnHeader, { flex: 2 }]}>EQUIPO</Text>
            <Text style={[styles.column, styles.columnHeader, { flex: 2 }]}>MODELO</Text>
            <Text style={[styles.column, styles.columnHeader, { flex: 1 }]}>P.UNI</Text>
            <Text style={[styles.column, styles.columnHeader, { flex: 1 }]}>IMPORTE</Text>
          </View>
          {quotation.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.column, { flex: 0.5 }]}>{item.quantity}</Text>
              <Text style={[styles.column, { flex: 0.5 }]}>{item.days}</Text>
              <Text style={[styles.column, { flex: 2 }]}>{item.name}</Text>
              <Text style={[styles.column, { flex: 2 }]}>{`${item.quantity} ${
                item.name
              } POR ${item.days} DIA`}</Text>
              <Text style={[styles.column, { flex: 1 }]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.column, { flex: 1 }]}>
                {formatCurrency(item.quantity * item.days * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sub total</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IGV 18%</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.igv)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total con IGV</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(quotation.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Una vez aceptada la cotización envienos su confirmación por vía mail,</Text>
          <Text>para iniciar con las coordinaciones del presente servicio. E-mail:</Text>
          <Text>ventas@ambientalpe.com N.CUENTA. BBVA SOLES:</Text>
          <Text>0011039694020045050 CCI:01139600020045050694 (B.NACIÓN) CTA.</Text>
          <Text>DE DETRACCIÓN : 00591113992 Nº DE CCI: 018591000591113992</Text>
        </View>
      </Page>
    </Document>
  )
}

