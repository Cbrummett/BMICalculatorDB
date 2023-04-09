import React, {useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  SafeAreaView,
  Pressable,
} from 'react-native';
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}
const db = openDatabase();

function BmiData() {
  const [bmiData, setBMIData] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select id, bmi, weight, height, date(itemDate) as itemDate from BMI order by itemDate desc;`,
        [],
        (_, { rows: { _array } }) => setBMIData(_array)
      );
    });
  }, []);

  if (bmiData === null || bmiData.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.sectionHeading}>BMI History</Text>
      {bmiData.map(({ id, bmi, weight, height, itemDate }) => (
        <View key={id}>
          <Text style={styles.sectionText}>{itemDate}:  {bmi}  (W:{weight}, H:{height})</Text>
        </View>
      ))}
    </View>
  );
}

export default function App () {
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmiText, setBMIText] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists BMI (id integer primary key not null, bmi text, weight text, height text, itemDate real);"
      );
    });
  }, []);

  const add = (bmi, weight, height) => {
    // is text empty?
    if (bmi === null || bmi === "" ||
     weight === null || weight === "" ||
      height === null || height === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into BMI (bmi, weight, height, itemDate) values (?, ?, ?, julianday('now'))", [bmi, weight, height]);
        tx.executeSql("select * from BMI", [], (_, { rows }) =>
          console.log(JSON.stringify(rows)),
        );
      },
      forceUpdate,
      null
    );
  };

  function computeBMI(){
    const h = parseInt(height);
    const w = parseInt(weight);
    const b = ((w / (h * h)) * 703);
    const formatB = b.toFixed(1);
    const BMI = formatB.toString();
    let evaluation = '';
    let bmiText = null;
    add(BMI, weight, height);
    if (b > 0 && b < 18.5 ){
      evaluation = "(Underweight)";
    } else if (b > 18.5 && b < 24.9){
      evaluation = "(Healthy)";
    } else if (b > 25 && b < 29.9){
      evaluation = "(Overweight)";
    } else if (b > 29.9){
      evaluation = "(Obese)";
    } else {
      evaluation = "";
    }
    if (BMI === "NaN" || BMI === null){
      bmiText = ""
    } else{
       bmiText = ("Body Mass Index is " + BMI);
    }
    setBMIText(bmiText);
    setEvaluation(evaluation);
    
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SQLite Example</Text>

      {Platform.OS === "web" ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.heading}>
            Expo SQlite is not supported on web!
          </Text>
        </View>
      ) : (
        <>
         <SafeAreaView style={styles.container}>
            <Text style={styles.toolbar}>BMI Calculator</Text>
            <ScrollView style={styles.content}>
              <TextInput
                style={styles.input}
                onChangeText={(weight) => setWeight(weight)}
                placeholder="Weight in Pounds"
                value={weight}
              />
              <TextInput
                style={styles.input}
                onChangeText={(height) => setHeight(height)}
                placeholder="Height in Inches"
                value={height}
              />
              <Pressable onPress={() => computeBMI()} style={styles.button}>
                <Text style={styles.buttonText}>Compute BMI</Text>
              </Pressable>
              <Text style={styles.bmi}>{bmiText}</Text>
              <Text style={styles.bmi}>{evaluation}</Text>
              
              <BmiData/>
          
            </ScrollView>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    textAlign: 'center',
    padding: 25,
    fontSize: 28,
    fontWeight: 'bold',
  },
  assessment: {
    fontSize: 20,
  },
  bmi: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  preview: {
    backgroundColor: '#bdc3c7',
    flex: 1,
    height: 500,
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
    fontSize: 24,
  },
  button: {
    backgroundColor: '#34495e',
    padding: 10,
    borderRadius: 3,
    marginBottom: 50,
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 24,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 20,
    
  }
});
  



