import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import { set } from 'react-hook-form';
import GeneratedRoutine from '../components/GeneratedRoutine';


const Dashboard = () => {
  const [goal, setGoal] = useState("");
  const [routine, setRoutine] = useState(null); // generated routine
  const [approved, setApproved] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedRoutine, setSavedRoutine] = useState(null); // routine from supabase

  const textareaRef = useRef(null);
  const socketRef = useRef(null);

  const navigate = useNavigate();

    useEffect(() => {
        setConnected(true);
        const fetchProfile = async () => {
            setLoading(true);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("User not authenticated");
                setShowPopup(true);
                navigate("/login");
                return;
            }

            setUser(user);

            const { data: profileData } = await supabase
                .from("profiles")
                .select("email, gender, age, routine")
                .eq("id", user.id)
                .maybeSingle();

            setProfile(profileData || null);

            // Update email in profiles table if not matching
            if (profileData && user.email && profileData.email !== user.email) {
                await supabase
                    .from("profiles")
                    .update({ email: user.email })
                    .eq("id", user.id);
            }

            // Only update savedRoutine here
            if (profileData && profileData.routine) {
                setSavedRoutine(profileData.routine);
            } else {
                setSavedRoutine(null);
            }
            setLoading(false);
        };
        fetchProfile();

        const { data: listener } = supabase.auth.onAuthStateChange(() => {
            fetchProfile();
        });
    }, []);

    // Remove the effect that updates supabase on every routine change
    // useEffect(() => {
    //     // Only update if user exists and routine is an array
    //     if (user && Array.isArray(routine)) {
    //         supabase
    //             .from("profiles")
    //             .update({ routine })
    //             .eq("id", user.id);
    //     }
    // }, [routine, user]);



    
  // useEffect(() => {
  //   // Connect to WebSocket server
  //   socketRef.current = new WebSocket("ws://localhost:8000/ws");

  //   socketRef.current.onopen = () => {
  //     setConnected(true);
  //   };

  //   socketRef.current.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     if (message.type === "routine") {
  //       setRoutine(message.data);
  //     } else if (message.type === "error") {
  //       setError(message.data);
  //     }
  //   };

  //   socketRef.current.onerror = (err) => {
  //     console.error("WebSocket error", err);
  //     setError("WebSocket error occurred.");
  //   };

  //   socketRef.current.onclose = () => {
  //     setConnected(false);
  //     console.warn("WebSocket connection closed.");
  //   };

  //   return () => socketRef.current?.close();
  // }, []);


  const sendGoal = () => {
  //   if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
  //     setError("WebSocket not connected.");
  //     return;
  // }
  //   const payload = {
  //     type: "goal",
  //     data: goal,
  //   };
  //   socketRef.current.send(JSON.stringify(payload));
    console.log("button clicked");
    console.log(`Email: ${user.email}\nGender: ${profile.gender}\nAge: ${profile.age}\n` );
    setWaiting(true);

    const message = textareaRef.current.value;
    fetch("http://127.0.0.1:8000/generate-routine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal: message, email: user.email ? user.email : "britantshrestha@gmail.com" }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Response from server:", data);
        if (data.routine) {
          setRoutineWithNotify(data.routine);
          setError(null);
        } else {
          setError("No routine generated.");
        }
      })
      .catch((err) => {
        setError("Failed to generate routine.");
        console.error(err);
      });
    setWaiting(false);
  };

  

  const setRoutineWithNotify = (routineData) => {
    if (Array.isArray(routineData)) {
      setRoutine(routineData.map(item => ({ ...item, notify: false })));
    } else {
      setRoutine(routineData);
    }
  };

  const handleRoutineApproval = async (routineToSave) => {
    if (user && Array.isArray(routineToSave)) {
        await supabase
            .from("profiles")
            .update({ routine: routineToSave })
            .eq("id", user.id);
        setSavedRoutine(routineToSave);
    }
    setRoutine(null); // clear generated routine after saving
    setApproved(true);
};

  return (

    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Goal-Based AI Planner
        </h1>
        <textarea
          className="w-full p-4 border rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          ref={textareaRef}
          placeholder="Enter your goal (e.g., I want 6 pack abs)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold transition"
          onClick={sendGoal}
          disabled={waiting}
        >
          {waiting ? "Submitting..." : "Submit Goal"}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Pass approval handler to GeneratedRoutine */}
        {routine && (
          <GeneratedRoutine
            routineState={[routine, setRoutine]}
            approvedState={[approved, setApproved]}
            onApprove={handleRoutineApproval}
          />
        )}

        {/* Saved routine section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Your Saved Routine</h2>
          {savedRoutine && Array.isArray(savedRoutine) && savedRoutine.length > 0 ? (
            <div className="bg-gray-100 p-4 rounded-lg text-sm mb-4">
              <div className="flex font-semibold text-gray-600 mb-2 px-1">
                <div className="flex-1 flex flex-row items-center">
                  <span className="w-24 mr-2">Time</span>
                  <span className="flex-1 mr-2">Message</span>
                  <span className="w-16 flex items-center justify-center">Notify</span>
                </div>
              </div>
              <ul className="space-y-2">
                {savedRoutine.map((item, idx) => (
                  <li key={idx} className="flex flex-col sm:flex-row sm:items-center">
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
                      <span className="w-24 font-semibold text-blue-700 mr-2">{item.time}</span>
                      <span className="flex-1 text-gray-800 mr-2">{item.message}</span>
                    </div>
                    <div className="w-16 flex items-center justify-center mt-2 sm:mt-0 sm:ml-auto">
                      <input type="checkbox" checked={item.notify} readOnly />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No routine saved.</p>
          )}
          <button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold"
            onClick={async () => {
              if (user) {
                await supabase
                  .from("profiles")
                  .update({ routine: null })
                  .eq("id", user.id);
                setSavedRoutine(null);
              }
            }}
            disabled={!savedRoutine}
          >
            Delete Routine
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard