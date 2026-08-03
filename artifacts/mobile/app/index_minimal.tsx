import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu préfères 2027</Text>

      <Text style={styles.subtitle}>
        Le jeu politique qui te fait choisir entre deux propositions opposées.
      </Text>

      <Pressable
        onPress={() => {
          router.push("/quiz");
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Démarrer le quiz</Text>
      </Pressable>

      <Text style={styles.footer}>
        Anonyme · 23 candidats · 200 questions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6fb",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    fontSize: 11,
    textAlign: "center",
    color: "#666",
  },
});
