import  clientLog  from "../../lib/clientlog";
import { View, StyleSheet, ScrollView, Modal, Pressable } from "react-native";
import {
  Text,
  Card,
  Button,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/auth-store";
import { spacing } from "../../src/theme/theme";
import { useEffect, useState } from "react";
import { useWorkouts } from "../../store/workoutsStore";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { loadWeek, week, loading, loadToday, today, generateAndPoll } =
    useWorkouts();
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  console.log("WEEK_DEBUG", week?.length, week);
  console.log("TODAY_DEBUG", today?.status, today?.title);
  clientLog("UI_DEBUG", { title: today?.title, status: today?.status });

  // Get today's date and find today's workout
  const todayDate = new Date().toISOString().split("T")[0];
  const todayWorkout = week?.find((w) => w.date.split("T")[0] === todayDate);

  // Use store's week data for stats
  const weekWorkouts = week || [];

  const handleStartWorkout = async () => {
    await loadToday(todayDate);

    if (today?.status !== "ready") {
      setIsGenerating(true);
      await generateAndPoll(
        today?.date || new Date().toISOString().split("T")[0],
      );
      setIsGenerating(false);
    }

    setShowWorkoutDetail(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Welcome back, {user?.name || "User"}!
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Today's Workout</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#7A3CF3" />
                <Text variant="bodySmall" style={styles.loadingText}>
                  Loading week...
                </Text>
              </View>
            ) : week && todayWorkout ? (
              <>
                <Text variant="bodyMedium" style={styles.cardText}>
                  {todayWorkout.title || "Your workout"} for{" "}
                  {new Date(todayWorkout.date).toLocaleDateString()} is ready!
                </Text>
                <Text variant="bodySmall" style={styles.statusText}>
                  Status: {todayWorkout.status}
                </Text>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={handleStartWorkout}
                  disabled={isGenerating}
                  loading={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Start Workout"}
                </Button>
              </>
            ) : week && !todayWorkout ? (
              <>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Not ready yet
                </Text>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={handleStartWorkout}
                  disabled={isGenerating}
                  loading={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Workout"}
                </Button>
              </>
            ) : (
              <>
                <Text variant="bodyMedium" style={styles.cardText}>
                  Ready to crush your fitness goals? Let's get started with a
                  personalized workout.
                </Text>
                <Button
                  mode="contained"
                  style={styles.button}
                  onPress={handleStartWorkout}
                  disabled={isGenerating}
                  loading={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Workout"}
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Weekly Progress</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              You're doing great! Keep up the momentum.
            </Text>
            <View style={styles.statsRow}>
              <Surface style={styles.statCard}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {weekWorkouts.filter((w) => w.status === "ready").length}
                </Text>
                <Text variant="bodySmall">Ready</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {weekWorkouts.length}
                </Text>
                <Text variant="bodySmall">This Week</Text>
              </Surface>
              <Surface style={styles.statCard}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {
                    weekWorkouts.filter(
                      (w) =>
                        w.status === "pending" || w.status === "generating",
                    ).length
                  }
                </Text>
                <Text variant="bodySmall">Pending</Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">AI Coach</Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Chat with your personal AI coach for motivation and guidance.
            </Text>
            <Button mode="outlined" style={styles.button}>
              Chat with Coach
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Workout Detail Modal - Same as in workouts.tsx */}
      <Modal
        visible={showWorkoutDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => setShowWorkoutDetail(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>

            {!today ||
            today.status === "pending" ||
            today.status === "generating" ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color="#7A3CF3" />
                <Text variant="headlineSmall" style={styles.generatingTitle}>
                  Generating your workout...
                </Text>
                <Text variant="bodyMedium" style={styles.generatingSubtitle}>
                  Our AI is creating the perfect workout for you
                </Text>
              </View>
            ) : today.status === "ready" && today.payloadJson ? (
              <ScrollView style={styles.workoutContent}>
                {/* Workout Header */}
                <Text variant="headlineMedium" style={styles.workoutTitle}>
                  {today?.title ?? "Workout"}
                </Text>
                {today?.status && (
                  <Text
                    testID="today-status"
                    variant="bodySmall"
                    style={styles.debugStatus}
                  >
                    Status: {today.status}
                  </Text>
                )}

                {today.payloadJson.duration_min && (
                  <Text variant="bodyLarge" style={styles.duration}>
                    Duration: {today.payloadJson.duration_min} minutes
                  </Text>
                )}

                {today.payloadJson.coach_notes && (
                  <View style={styles.coachNotesContainer}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Coach Notes
                    </Text>
                    <Text variant="bodyMedium" style={styles.coachNotes}>
                      {today.payloadJson.coach_notes}
                    </Text>
                  </View>
                )}

                {/* Workout Blocks */}
                {!today.payloadJson.blocks ||
                today.payloadJson.blocks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      No exercises yet
                    </Text>
                  </View>
                ) : (
                  (() => {
                    const blockOrder = { warmup: 0, main: 1, recovery: 2 };
                    const sortedBlocks = [...today.payloadJson.blocks].sort(
                      (a, b) =>
                        (blockOrder[a.type as keyof typeof blockOrder] ?? 999) -
                        (blockOrder[b.type as keyof typeof blockOrder] ?? 999),
                    );

                    return sortedBlocks.map(
                      (block: any, blockIndex: number) => (
                        <View key={blockIndex} style={styles.blockContainer}>
                          <Text variant="titleLarge" style={styles.blockTitle}>
                            {block.type === "warmup"
                              ? "Warm-up"
                              : block.type === "main"
                                ? "Workout"
                                : block.type === "recovery"
                                  ? "Recovery"
                                  : block.type}
                          </Text>

                          {block.items?.map((item: any, itemIndex: number) => (
                            <Card key={itemIndex} style={styles.exerciseCard}>
                              <Card.Content>
                                <Text
                                  variant="titleMedium"
                                  style={styles.exerciseName}
                                >
                                  {item.name}
                                </Text>
                                <View style={styles.exerciseDetails}>
                                  <Text variant="bodyMedium">
                                    {item.sets} sets × {item.reps} reps
                                  </Text>
                                  {item.rest_sec && (
                                    <Text
                                      variant="bodySmall"
                                      style={styles.restTime}
                                    >
                                      Rest: {item.rest_sec}s
                                    </Text>
                                  )}
                                  {item.load && (
                                    <Text
                                      variant="bodySmall"
                                      style={styles.loadText}
                                    >
                                      Load: {item.load}
                                    </Text>
                                  )}
                                </View>
                              </Card.Content>
                            </Card>
                          ))}
                        </View>
                      ),
                    );
                  })()
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Text variant="headlineSmall" style={styles.errorTitle}>
                  Unable to load workout
                </Text>
                <Text variant="bodyMedium">
                  Status: {today?.status || "Unknown"}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: spacing.lg,
  },
  greeting: {
    marginBottom: spacing.xl,
    color: "#1F2937",
  },
  card: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  cardText: {
    marginVertical: spacing.sm,
    color: "#6B7280",
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
    alignItems: "center",
    elevation: 1,
  },
  statNumber: {
    color: "#7A3CF3",
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: "#6B7280",
  },
  statusText: {
    marginTop: spacing.xs,
    color: "#10B981",
    textTransform: "capitalize",
  },
  // Modal styles - Same as in workouts.tsx
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    padding: spacing.lg,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: 16,
    color: "#7A3CF3",
    fontWeight: "500",
  },
  generatingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  generatingTitle: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: "#1F2937",
  },
  generatingSubtitle: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: "#6B7280",
  },
  workoutContent: {
    flex: 1,
  },
  workoutTitle: {
    color: "#1F2937",
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  debugStatus: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: 12,
  },
  duration: {
    color: "#6B7280",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  coachNotesContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
  },
  sectionTitle: {
    color: "#1F2937",
    marginBottom: spacing.sm,
  },
  coachNotes: {
    color: "#374151",
  },
  blockContainer: {
    marginBottom: spacing.lg,
  },
  blockTitle: {
    color: "#1F2937",
    marginBottom: spacing.md,
    textAlign: "center",
    fontWeight: "bold",
  },
  exerciseCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    elevation: 1,
  },
  exerciseName: {
    color: "#1F2937",
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restTime: {
    color: "#6B7280",
  },
  loadText: {
    color: "#7A3CF3",
    fontWeight: "500",
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
