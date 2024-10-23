import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';

interface Card {
  id: number;
  material: string;
  isFlipped: boolean;
  isMatched: boolean;
  isContaminant: boolean;
}

interface ScoreEntry {
  score: number;
  time: number;
}

const initialRecyclableMaterials = [
  { material: 'Plastic Bottle', isContaminant: false },
  { material: 'Paper Bag', isContaminant: false },
  { material: 'Glass Jar', isContaminant: false },
  { material: 'Metal Can', isContaminant: false },
  { material: 'Plastic Bottle', isContaminant: false },
  { material: 'Paper Bag', isContaminant: false },
  { material: 'Glass Jar', isContaminant: false },
  { material: 'Metal Can', isContaminant: false },
  { material: 'Food Waste', isContaminant: true },
  { material: 'Styrofoam', isContaminant: true }
];

const additionalRecyclableMaterials = [
  { material: 'Cardboard Box', isContaminant: false },
  { material: 'Newspaper', isContaminant: false },
  { material: 'Aluminum Foil', isContaminant: false },
  { material: 'Plastic Straw', isContaminant: true },
  { material: 'Plastic Bag', isContaminant: true }
];

export default function App() {
  const [screen, setScreen] = useState<'home' | 'game' | 'result'>('home');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [matches, setMatches] = useState(0);
  const [points, setPoints] = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRushMode, setIsRushMode] = useState(false);
  const [rushTriggered, setRushTriggered] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [currentMaterialSet, setCurrentMaterialSet] = useState(initialRecyclableMaterials);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    if (screen === 'game') {
      initializeGame();
    }
  }, [screen]);

  useEffect(() => {
    if (timeLimit <= 0 && timer) {
      clearInterval(timer);
      endGame();
    }
  }, [timeLimit]);

  useEffect(() => {
    if (matches === currentMaterialSet.filter(item => !item.isContaminant).length / 2) {
      endGame();
    }
  }, [matches]);

  const initializeGame = () => {
    const shuffledCards = [...currentMaterialSet]
      .sort(() => 0.5 - Math.random())
      .map((item, index) => ({
        id: index,
        material: item.material,
        isFlipped: false,
        isMatched: false,
        isContaminant: item.isContaminant
      }));

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatches(0);
    setPoints(0);
    setGameStartTime(Date.now());
    setTimeLimit(60);
    setIsRushMode(false);
    setRushTriggered(false);
    setGameCompleted(false);

    if (timer) clearInterval(timer);
    const newTimer = setInterval(() => {
      setTimeLimit(prev => prev - 1);
    }, 1000);
    setTimer(newTimer);
  };

  const triggerRecyclingRush = () => {
    if (!rushTriggered) {
      const rushChance = Math.random();
      if (rushChance < 0.3 && !isRushMode) {
        setIsRushMode(true);
        setRushTriggered(true);
        if (timer) clearInterval(timer);

        const rushTimer = setInterval(() => {
          setTimeLimit(prev => Math.max(prev - 2, 0));
        }, 500);

        setTimer(rushTimer);

        setTimeout(() => {
          setIsRushMode(false);
          clearInterval(rushTimer);
          const normalTimer = setInterval(() => {
            setTimeLimit(prev => Math.max(prev - 1, 0));
          }, 1000);
          setTimer(normalTimer);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    if (screen === 'game') {
      triggerRecyclingRush();
    }
  }, [screen]);

  const flipCard = (card: Card) => {
    if (flippedCards.length === 2 || card.isFlipped || card.isMatched) return;

    const updatedCards = cards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);
    setFlippedCards(prev => [...prev, card]);

    if (flippedCards.length === 1) {
      checkMatch(flippedCards[0], card);
    }
  };

  const checkMatch = (card1: Card, card2: Card) => {
    if (card1.material === card2.material && !card1.isContaminant) {
      setCards(prevCards =>
        prevCards.map(c =>
          c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c
        )
      );
      setMatches(prev => prev + 1);
      setPoints(prev => prev + 10);
    } else if (card1.isContaminant || card2.isContaminant) {
      setPoints(prev => prev - 5);
    }

    setTimeout(() => {
      setCards(prevCards =>
        prevCards.map(c => (c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c))
      );
      setFlippedCards([]);
    }, 1000);
  };

  const endGame = () => {
    if (timer) clearInterval(timer);
    const completionTime = (Date.now() - gameStartTime) / 1000;

    if (!gameCompleted) {
      const newEntry = { score: points, time: completionTime };
      setLeaderboard(prev => [...prev, newEntry]);
      setGameCompleted(true);
    }

    setScreen('result');
  };

  const startGame = () => {
    setScreen('game');
  };

  const recycleMore = () => {
    setCurrentMaterialSet(prevSet => [...prevSet, ...additionalRecyclableMaterials]);
    setScreen('game');
  };

  const renderCard = ({ item }: { item: Card }) => (
    <TouchableOpacity onPress={() => flipCard(item)} style={styles.card}>
      <Text>{item.isFlipped || item.isMatched ? item.material : '?'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {screen === 'home' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Welcome to the Recycling Challenge</Text>
          <TouchableOpacity onPress={startGame} style={styles.button}>
            <Text style={styles.buttonText}>Start Recycling</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'game' && (
        <View style={styles.gameContainer}>
          <Text style={styles.title}>Garbage Truck Time Limit: {timeLimit}s</Text>
          <FlatList
            data={cards}
            numColumns={4}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
          />
          <Text>Points: {points}</Text>
        </View>
      )}

      {screen === 'result' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Recycling Points: {points}</Text>
          <TouchableOpacity onPress={recycleMore} style={styles.button}>
            <Text style={styles.buttonText}>Recycle More</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Leaderboard</Text>
          {leaderboard.map((entry, index) => (
            <Text key={index}>
              Game {index + 1}: {entry.score} points in {entry.time.toFixed(2)} seconds
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  card: {
    backgroundColor: '#fff',
    margin: 5,
    padding: 20,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
