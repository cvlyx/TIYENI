import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform, Pressable,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useColors } from "@/hooks/useColors";

const TOP_UP_AMOUNTS = [2000, 5000, 10000, 20000, 50000];

function formatDate(ts: string | number) {
  return new Date(ts).toLocaleDateString("en-MW", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const txTypeConfig = {
  topup: { icon: "arrow-down-circle-outline", color: "#22C55E", prefix: "+" },
  received: { icon: "arrow-down-circle-outline", color: "#22C55E", prefix: "+" },
  payment: { icon: "arrow-up-circle-outline", color: "#EF4444", prefix: "-" },
  withdrawal: { icon: "arrow-up-circle-outline", color: "#EF4444", prefix: "-" },
  escrow_hold: { icon: "lock-closed-outline", color: "#F59E0B", prefix: "-" },
  escrow_release: { icon: "lock-open-outline", color: "#22C55E", prefix: "+" },
} as const;

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadWallet = async () => {
    try {
      const data = await api.getWallet();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch {
      showToast("Could not load wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWallet(); }, []);

  const handleTopUp = async () => {
    if (!selectedAmount) { showToast("Select an amount", "error"); return; }
    setIsProcessing(true);
    try {
      const { checkoutUrl } = await api.initiateTopUp(selectedAmount);
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      // Refresh wallet after browser closes
      await loadWallet();
      if (result.type === "opened" || result.type === "dismiss") {
        showToast("Wallet refreshed", "info");
      }
    } catch (e: any) {
      showToast(e.message ?? "Payment failed", "error");
    } finally {
      setIsProcessing(false);
      setSelectedAmount(null);
    }
  };

  const handleWithdraw = async () => {
    if (balance < 1000) { showToast("Minimum withdrawal is MWK 1,000", "error"); return; }
    setIsProcessing(true);
    try {
      const { newBalance } = await api.withdraw(balance, "Airtel Money");
      setBalance(newBalance);
      showToast("Withdrawal initiated", "success");
      await loadWallet();
    } catch (e: any) {
      showToast(e.message ?? "Withdrawal failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Wallet</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={["#1A4A1E", "#2E7D32"]} style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>MWK {balance.toLocaleString()}</Text>
              <View style={styles.balanceActions}>
                <Pressable style={styles.balanceAction} onPress={handleWithdraw} disabled={isProcessing}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.balanceActionText}>Withdraw</Text>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Up via PayChangu</Text>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Select amount (MWK)</Text>
              <View style={styles.amountGrid}>
                {TOP_UP_AMOUNTS.map((amt) => (
                  <Pressable
                    key={amt}
                    onPress={() => setSelectedAmount(amt)}
                    style={[
                      styles.amountBtn,
                      { backgroundColor: selectedAmount === amt ? colors.primary : colors.muted, borderColor: selectedAmount === amt ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[styles.amountText, { color: selectedAmount === amt ? "#fff" : colors.foreground }]}>
                      {amt.toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleTopUp}
                disabled={isProcessing || !selectedAmount}
                style={[styles.topUpBtn, { backgroundColor: colors.primary, opacity: isProcessing || !selectedAmount ? 0.6 : 1 }]}
              >
                {isProcessing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.topUpBtnText}>{selectedAmount ? `Pay MWK ${selectedAmount.toLocaleString()}` : "Select Amount"}</Text>
                }
              </Pressable>
              <Text style={[styles.paychanguNote, { color: colors.mutedForeground }]}>
                Powered by PayChangu · Airtel Money, TNM Mpamba & Bank Transfer accepted
              </Text>
            </View>

            <Text style={[styles.txTitle, { color: colors.foreground }]}>Transaction History</Text>
          </View>
        }
        renderItem={({ item: tx }) => {
          const cfg = txTypeConfig[tx.type as keyof typeof txTypeConfig] ?? txTypeConfig.topup;
          return (
            <View style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.txIcon, { backgroundColor: cfg.color + "15" }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                {tx.counterparty && <Text style={[styles.txSub, { color: colors.mutedForeground }]}>{tx.counterparty}</Text>}
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{formatDate(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: cfg.color }]}>
                {cfg.prefix}MWK {tx.amount.toLocaleString()}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyTx}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" }}>No transactions yet</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onRefresh={loadWallet}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  balanceAmount: { color: "#fff", fontSize: 36, fontFamily: "Inter_700Bold", marginBottom: 20 },
  balanceActions: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12 },
  balanceAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  balanceActionText: { color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  subLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  amountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  amountText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  topUpBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", marginBottom: 10 },
  topUpBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  paychanguNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  txTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8, marginTop: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 2 },
  txSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyTx: { alignItems: "center", padding: 20 },
});
