---
title: "A map of machine learning algorithms: from the five tribes to real systems"
description: A tour of common machine learning algorithms organized by Pedro Domingos's "five tribes" (Bayesians, analogizers, symbolists, connectionists, and evolutionaries), plus unsupervised and reinforcement learning. Each algorithm comes with an intuitive example, and the post ends with a real system that combines several of them.
date: 2026-11-20
category: ai
tags: [AI, Machine learning, Algorithms, Deep learning]
translationKey: ml-algorithms
---

## By task

Start with the question "what problem are we solving?" Common algorithms group roughly like this:

| Task | Typical algorithms |
| --- | --- |
| Classification | SVM, KNN, naive Bayes, decision trees |
| Regression (predicting a number) | Linear regression, regression trees, KNN regression |
| Sequence modeling | Markov chains, hidden Markov models (HMMs) |
| Clustering | K-means, hierarchical clustering |
| Dimensionality reduction | Principal component analysis (PCA), factor analysis (FA) |
| Association rules | Apriori |
| Decision-making and control | Q-learning, deep Q-learning (DQN) |

## Domingos's five tribes

Another way to divide them is by the reasoning behind each algorithm. In *The Master Algorithm* (2015), Pedro Domingos of the University of Washington splits machine learning researchers into five tribes:

| Tribe | How it reasons | Typical algorithms |
| --- | --- | --- |
| Bayesians | Handle uncertainty with probability and Bayes' theorem | Naive Bayes, Markov chains, HMMs |
| Analogizers | Judge by similarity to known examples | KNN, SVM |
| Symbolists | Infer with logical rules and if-then reasoning | Decision trees, rule learning, expert systems |
| Connectionists | Imitate the brain with layers of connected neurons | Artificial neural networks, deep learning |
| Evolutionaries | Imitate natural selection, evolving solutions over generations | Genetic algorithms, genetic programming |

Unsupervised learning and reinforcement learning are not tribes in the book. They belong to a different axis (how a model learns) and are covered separately below.

## 1. Bayesians

Core idea: **the world is uncertain, so express beliefs as probabilities and update them as new evidence arrives.**

### Naive Bayes

Naive Bayes uses Bayes' theorem to compute the probability that an item belongs to a class given its features, assuming the features are independent of each other. That assumption almost never holds in practice (hence "naive"), but the method is fast and often works well.

Spam filtering is the classic example: count how often words like "free", "winner", and "click" appear in spam versus normal mail. When a new message arrives, multiply the per-word probabilities and see which class comes out higher.

### Markov chains

The idea: **the next state depends only on the current state, not on anything earlier.**

Take the weather:

```
Sunny today → tomorrow: 80% sunny, 20% rain
Rainy today → tomorrow: 70% rain, 30% sunny
```

To predict tomorrow, you only need today. Last month's weather doesn't matter.

Text can be generated the same way: after "I", the next word is "love" 90% of the time and "hate" 10%; after "love", it's "you" 60%, "cats" 20%, "eating" 20%, and you keep sampling. Early chatbots and the next-word suggestions in input methods used models like this.

### Hidden Markov models (HMMs)

One layer more than a Markov chain: **you can't see the true state, only the observations it produces.**

A doctor doesn't know whether a patient is really "healthy", has "a cold", or has "pneumonia". All they can see are symptoms such as fever, cough, and a runny nose. Given a sequence of observations, an HMM infers the most likely sequence of hidden states behind them.

Common uses: speech recognition (the mainstream approach before deep learning), Chinese word segmentation, part-of-speech tagging, and DNA sequence analysis.

## 2. Analogizers

Core idea: **find the known examples a new item most resembles, and judge it the same way.**

### KNN (k-nearest neighbors)

Very intuitive. Suppose you have this fruit data:

| Weight | Color |
| --- | --- |
| 95 g | Red |
| 100 g | Red |
| 110 g | Red |
| 300 g | Yellow |
| 310 g | Yellow |

A new 105 g fruit arrives. Its three nearest neighbors (100 g, 110 g, 95 g) are all red, so you predict red.

KNN also works for regression: if three nearby houses sold for 10.0, 11.0, and 9.8 million, you'd estimate yours at about 10.27 million (their average).

- Pros: No training step. Store the data and it's ready.
- Cons: Every prediction compares against all the data, so it slows down as the dataset grows. Features on different scales also need to be normalized first.

### Support vector machines (SVMs)

Core idea: **find the best dividing line.**

```
○ ○ ○ ○
─────────
× × × ×
```

Many lines can separate the two classes. An SVM picks the one that is **as far as possible from the nearest points on each side**, known as the maximum margin. When the data can't be split by a straight line, the kernel trick maps it into a higher-dimensional space and finds a boundary there. Spam detection and text classification are common SVM applications.

## 3. Symbolists

Core idea: **represent knowledge as symbols and logical rules, and reach conclusions by inference.**

Early expert systems were built from rules that people wrote by hand, for example:

```
IF income > 50,000 AND credit is good AND age is 20–60
THEN approve the loan
```

Hand-written rules are easy to explain but become hard to maintain as they pile up. The machine learning version of the symbolist approach has the computer **learn the rules from data** instead, and the decision tree is the classic example.

### Decision trees

A decision tree works like a game of Twenty Questions, asking one question after another until it reaches an answer. For example, will this person buy a computer?

```
High income?
├─ Yes → buy
└─ No → Student?
        ├─ Yes → buy
        └─ No → don't buy
```

The algorithm learns from data which questions to ask and where to set the thresholds. That is what separates it from hand-written rules. A common object-detection post-processing step like "keep the box if confidence > 0.7 and area > 500" looks like a tree, but it's a rule a person chose, not a learned decision tree.

Decision trees are easy to interpret, but a single tree overfits easily.

### Ensembles: many trees voting together

Instead of trusting one tree, let many trees vote.

- **Bagging**: Draw samples from the training data with replacement (bootstrap), train each tree on a different sample, and take a vote. If five trees say "dog, dog, dog, cat, dog", the answer is dog. This reduces variance and overfitting.
- **Random forests**: An extension of bagging. On top of each tree getting a different sample, **each split considers only a random subset of the features**. If a fruit has four features (weight, color, sweetness, size), one node might consider only weight and sweetness while another considers only color and size. This makes the trees more different from each other, which makes the vote more effective.

Random forests are popular in industry for tabular data: they need little tuning, train quickly, perform reliably, and report feature importance. With hundreds of trees voting, though, you can't read off the reasoning the way you can with a single tree.

## 4. Connectionists

This is today's most popular tribe: **neural networks**.

### The core idea: learn from experience, not from rules

The biggest difference between connectionism and rule-based methods: **people don't teach the computer rules. The computer finds the patterns itself from many examples.**

Think about how a small child learns what a cat is. You don't say "four legs, whiskers, pointy ears, and a long tail means cat". You point again and again: "That's a cat." "That's a cat too." After a few hundred times, the child recognizes new cats of different colors, sizes, builds, and coat lengths. Ask them why, and they usually can't say. It just looks like a cat.

Recognizing people works the same way. You still recognize your dad when he wears a hat or a mask, gets a haircut, or puts on a suit. You aren't relying on a single rule like "long hair means Dad" or "beard means Dad". You combine many features at once: face shape, eyes, voice, height, the way he walks.

That's what a neural network does: **it learns to combine evidence from many examples, and applies what it learned to examples it has never seen.** This is called generalization. It's like learning addition: you don't memorize "1+1=2, 2+2=4"; you understand the rule, so you can do "100+100" too.

### Why "connection"

Because it imitates the neurons in the brain: many neurons arranged in layers, each passing what it has processed to the next. When researchers visualized trained convolutional networks, they found a division of labor like this when recognizing a photo of a cat:

```
Layer 1: edges, colors, light and dark
Layer 2: combined into textures and simple shapes
Layer 3: combined into parts like eyes and ears
Deeper layers: combined into a face, and finally "this is a cat"
```

The later the layer, the more abstract the concept it represents. That's the "deep" in deep learning: **not lots of data, but lots of layers.**

### Shallow networks and deep learning

- **Shallow neural networks** have one or two hidden layers. For MNIST handwritten digits: 784 inputs (28×28 pixels) → 128 hidden neurons → 10 outputs (the digits 0–9).
- **Deep learning** uses many, many layers, for example `image → stacked convolutions (CNN) → Transformer → output`. YOLO, ResNet, EfficientNet, ViT, and large language models (LLMs) are all deep learning models.

### Why AI today runs on deep learning

Because many things simply can't be written as rules. Try writing rules to recognize a dog: four legs, a tail, ears... but foxes and wolves match too, and huskies, chihuahuas, and golden retrievers all look completely different. You'd never finish. So instead you show a model a huge number of labeled dog photos and let it learn. The cost is that it needs lots of data and compute, and its reasoning is hard to explain.

## 5. Evolutionaries

Core idea: **imitate natural evolution, letting good solutions survive, reproduce, and mutate.**

### Genetic algorithms (GAs)

```
Generate 100 random solutions → score them → keep the best
→ crossover (swap pieces) → mutate (random changes) → next generation → repeat
```

Take the traveling salesman problem (TSP): each solution is an order for visiting the cities (ABCDE, BACDE, CADBE, ...). Each generation keeps the routes with shorter total distance, then breeds and mutates them into new routes.

In practice, GAs are also used for hyperparameter tuning. Ultralytics YOLO, for example, tunes hyperparameters with an evolutionary approach, mutating values like the learning rate and momentum over generations and keeping the best-performing combination.

## 6. By learning style: unsupervised and reinforcement learning

Domingos's tribes are organized by reasoning. Modern textbooks more often organize by **how a model learns**: supervised, unsupervised, semi-supervised, self-supervised, and reinforcement learning. The two below often appear on the same chart as the tribes, but they are not tribes.

### Unsupervised learning: no answers, find the patterns yourself

**K-means (clustering)**: Split 100 customers into three groups by age and income. Afterward you might find the groups correspond to students, young professionals, and high earners, but the data itself had no labels.

```
Place K centers at random → assign each point to its nearest center
→ recompute each center as its cluster's mean → repeat until the centers stop moving
```

**PCA (principal component analysis, dimensionality reduction)**: Compress 100 features into 5 while keeping as much of the data's variance (information) as possible. A 1920×1080 grayscale image has about 2.07 million pixels, which makes it a 2.07-million-dimensional data point, and PCA can compress it substantially. PCA is also widely used to plot high-dimensional data in 2D or 3D.

### Reinforcement learning: learning a strategy from rewards

Reinforcement learning doesn't learn the "right answer". It learns a strategy through trial and error:

```
Take an action → receive a reward → adjust the strategy → repeat
```

In a board game, a win is +1 and a loss is −1, and the agent gets stronger the more it plays. DeepMind's AlphaGo (2016) first learned from 30 million moves of human expert games by supervised learning, then improved through reinforcement learning by playing against itself, and used Monte Carlo tree search during play. Its successor, AlphaGo Zero, used no human games at all. Other applications include walking robots, self-driving cars, and game AI.

## A real system: several algorithms combined

Consider a system that reads license plates from a camera feed:

```
RTSP camera
  ↓
YOLO detects vehicles and plates (deep learning, connectionist)
  ↓
ByteTrack multi-object tracking (Kalman filter predicts positions + Hungarian algorithm for data association)
  ↓
PaddleOCR reads the plate text (deep learning)
  ↓
Business rules (rule-based logic), for example:
- The front of the car crosses the first line, the rear crosses the second
- Save each track ID only once
- Discard readings with confidence below 0.5
```

As you can see, **real AI systems rarely rely on a single algorithm. They combine deep learning, tracking algorithms, and rule-based logic.** YOLO and OCR handle perception, ByteTrack handles association, and the trigger lines, caching, and event logic are rule-based code that carries out the business process.

## Summary

| Group | Core idea | Typical algorithms | Common uses |
| --- | --- | --- | --- |
| Bayesians | Handle uncertainty with probability | Naive Bayes, Markov chains, HMMs | Spam filtering, (early) speech recognition, word segmentation |
| Analogizers | Find the most similar examples | KNN, SVM | Classification, regression, recommendation |
| Symbolists | Infer with logical rules | Expert systems, decision trees, random forests | Credit scoring, medical diagnosis, industrial prediction |
| Connectionists | Learn features from data with neural networks | ANNs, CNNs, Transformers, YOLO | Computer vision, speech recognition, LLMs |
| Evolutionaries | Imitate natural evolution | Genetic algorithms, genetic programming | Optimization, hyperparameter search |
| Unsupervised learning | Find patterns in unlabeled data | K-means, PCA | Clustering, dimensionality reduction, anomaly detection |
| Reinforcement learning | Learn a strategy from rewards | Q-learning, DQN | Games, robotics, AlphaGo |

One last note: the five tribes are a fairly historical way of dividing the field. They're useful for understanding where each school of thought came from, but the boundaries aren't absolute. Random forests, for instance, are usually filed under ensemble learning rather than symbolism, reinforcement learning doesn't belong to any tribe, and Domingos's own argument is that the strengths of all the tribes should be combined into one "master algorithm".

## References

- Pedro Domingos, *[The Master Algorithm](https://en.wikipedia.org/wiki/The_Master_Algorithm)*, 2015; ACM talk, "[The Five Tribes of Machine Learning](https://learning.acm.org/techtalks/machinelearning)"
- Leo Breiman, "[Random Forests](https://www.stat.berkeley.edu/~breiman/randomforest2001.pdf)", 2001
- Silver et al., "[Mastering the game of Go with deep neural networks and tree search](https://research.google/pubs/mastering-the-game-of-go-with-deep-neural-networks-and-tree-search/)", Nature, 2016
- Zeiler & Fergus, "[Visualizing and Understanding Convolutional Networks](https://arxiv.org/abs/1311.2901)", 2013
- Zhang et al., "[ByteTrack: Multi-Object Tracking by Associating Every Detection Box](https://arxiv.org/abs/2110.06864)", 2021
- Ultralytics, "[Hyperparameter Tuning](https://docs.ultralytics.com/guides/hyperparameter-tuning/)"
