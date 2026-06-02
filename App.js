import React from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tu préfères 2027</Text>
      <Text style={styles.subtitle}>L’application fonctionne.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#07081f",
  },
  title: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    color: "#cbd5e1",
    fontSize: 18,
    textAlign: "center",
  },
});
