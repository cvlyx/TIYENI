import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Message, useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

function TypingIndicator() {
  const colors = useColors();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={[styles.typingContainer, { backgroundColor: colors.muted }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.typingDot,
            { backgroundColor: dots > i ? colors.primary : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const colors = useColors();
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isOwn ? "#fff" : colors.foreground }]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: isOwn ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
          {timeStr}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, sendMessage } = useAppData();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const convo = conversations.find((c) => c.id === id);

  useEffect(() => {
    if (convo && convo.messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [convo?.messages.length]);

  const handleSend = () => {
    if (!text.trim() || !user || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(id, text.trim(), user.id);
    setText("");

    setShowTyping(true);
    const delay = 1200 + Math.random() * 1500;
    setTimeout(() => {
      setShowTyping(false);
      const replies = [
        "Okay, sounds good!",
        "I can do that.",
        "When would you like to proceed?",
        "Sure, let me confirm and get back to you.",
        "That works for me!",
        "Perfect, I'll be ready.",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      if (id && convo) {
        sendMessage(id, reply, convo.participantId);
      }
    }, delay);
  };

  if (!convo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Chat</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Conversation not found</Text>
        </View>
      </View>
    );
  }

  const initials = convo.participantName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.headerBar, { paddingTop: topPadding + 16, backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={[styles.avatarSm, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarSmText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={[styles.headerName, { color: colors.foreground }]}>{convo.participantName}</Text>
            {convo.isVerified && <VerifiedBadge />}
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Tap to view profile</Text>
        </View>
        <Pressable style={[styles.callBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="call-outline" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <FlatList
        ref={flatRef}
        data={convo.messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.id || item.senderId === "current"} />
        )}
        contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={showTyping ? <TypingIndicator /> : null}
      />

      <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: bottomPadding + 8, backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.muted, color: colors.foreground }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
        >
          <Ionicons name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarSm: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  headerInfo: { flex: 1 },
  headerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: { paddingHorizontal: 16, paddingTop: 12 },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "flex-start",
  },
  bubbleRowOwn: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    gap: 2,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 16,
    gap: 4,
    marginLeft: 16,
    marginBottom: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
