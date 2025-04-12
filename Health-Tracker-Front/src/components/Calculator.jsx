import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Select,
  TextField,
  Button,
} from "@mui/material";
import axios from "axios";

export default function CalorieCalculator() {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(18);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(180);
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [goal, setGoal] = useState("maintain-weight");
  const [result, setResult] = useState(null);

  const calculate = () => {
    let bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      "lightly-active": 1.375,
      "moderately-active": 1.55,
      "very-active": 1.725,
      "extremely-active": 1.9,
    };

    let tdee = bmr * activityMultipliers[activityLevel];
    let protein = weight * 2.2;
    let fat = weight * 0.9;
    let carbs = (tdee - (protein * 4 + fat * 9)) / 4;

    setResult({ tdee, protein, fat, carbs });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="shadow-lg rounded-2xl p-6 bg-white dark:bg-gray-800 max-w-md w-full">
        <CardHeader
          title="Calorie Calculator"
          className="text-center font-bold"
        />
        <CardContent className="flex flex-col gap-4">
          <Select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            fullWidth
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
          <TextField
            type="number"
            label="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label="Height (cm)"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            fullWidth
          />
          <Select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            fullWidth
          >
            <MenuItem value="sedentary">Sedentary</MenuItem>
            <MenuItem value="lightly-active">Lightly Active</MenuItem>
            <MenuItem value="moderately-active">Moderately Active</MenuItem>
            <MenuItem value="very-active">Very Active</MenuItem>
            <MenuItem value="extremely-active">Extremely Active</MenuItem>
          </Select>
          <Select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            fullWidth
          >
            <MenuItem value="lose-weight">Lose Weight</MenuItem>
            <MenuItem value="maintain-weight">Maintain Weight</MenuItem>
            <MenuItem value="gain-weight">Gain Weight</MenuItem>
          </Select>
          <Button
            variant="contained"
            color="primary"
            onClick={calculate}
            fullWidth
          >
            Calculate
          </Button>
          {result && (
            <div className="text-center mt-4 text-lg">
              <p>Daily Calories: {result.tdee.toFixed(2)}</p>
              <p>Protein: {result.protein.toFixed(2)} g</p>
              <p>Fat: {result.fat.toFixed(2)} g</p>
              <p>Carbs: {result.carbs.toFixed(2)} g</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
