import { router } from "expo-router";
import { useEffect } from "react";

export default function PostTab() {
  useEffect(() => {
    router.push("/(post)/");
  }, []);
  return null;
}
