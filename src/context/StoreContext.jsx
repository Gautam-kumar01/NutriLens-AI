import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext();
export const useStore = () => useContext(StoreContext);

const calcTargets = (profile) => {
  const { age, gender, height, weight, activity, goalMode } = profile;
  const mult = { light: 1.375, moderate: 1.55, active: 1.725 }[activity] ?? 1.55;
  let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  let cal = Math.round(bmr * mult);
  if (goalMode === 'lose') cal -= 500;
  if (goalMode === 'gain') cal += 500;
  return {
    targetCalories: cal,
    targetProtein:  Math.round((cal * 0.30) / 4),
    targetCarbs:    Math.round((cal * 0.40) / 4),
    targetFat:      Math.round((cal * 0.30) / 9),
  };
};

const DEFAULT = {
  hasOnboarded: false,
  profile: { age: 25, gender: 'male', height: 170, weight: 68, activity: 'moderate', goalMode: 'lose' },
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 65,
  water: 0,
  streak: 3,
  history: [],
  theme: 'light',
};

export const StoreProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem('calAiState_v2');
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch { return DEFAULT; }
  });

  useEffect(() => {
    localStorage.setItem('calAiState_v2', JSON.stringify(state));
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state]);

  const updateProfile = (profile) => {
    setState(prev => ({
      ...prev,
      profile,
      hasOnboarded: true,
      ...calcTargets(profile),
    }));
  };

  const addMeal = (meal) => {
    const entry = {
      ...meal,
      id:   meal.id ?? Date.now().toString(),
      time: meal.time ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: meal.date ?? new Date().toISOString().split('T')[0],
      type: meal.type ?? 'lunch',
    };
    setState(prev => ({
      ...prev,
      streak: Math.max(prev.streak, 1),
      history: [entry, ...prev.history].slice(0, 50),
    }));
  };

  const addWater = () => setState(prev => ({ ...prev, water: Math.min((prev.water ?? 0) + 1, 8) }));

  const setTheme = (theme) => setState(prev => ({ ...prev, theme }));

  return (
    <StoreContext.Provider value={{ state, updateProfile, addMeal, addWater, setTheme }}>
      {children}
    </StoreContext.Provider>
  );
};
