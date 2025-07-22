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
                // setMessage("User not authenticated");
                // setShowPopup(true);
                setError("User not authenticated");
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
      })
      .finally(() => {
        setWaiting(false); // <-- move here
      });
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

    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-gray-800 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-3xl border border-gray-700">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-white leading-tight">
          Goal-Based AI Planner
        </h1>
        <p className="text-lg text-center mb-10 text-white">
          Describe your fitness or health goal, and our AI will generate a personalized routine for you.
        </p>
        <div className="mb-6">
          <textarea
            className="w-full p-4 sm:p-5 border border-gray-600 rounded-xl mb-4 text-lg text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ease-in-out resize-y min-h-[120px]"
            ref={textareaRef}
            placeholder="E.g., I want to run a marathon in 6 months, I need a 30-day weight loss plan, or I want to build muscle mass and strength."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3} // Set initial rows for better appearance
          />
        </div>
        <button
          className={`w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg ${
            waiting
              ? "bg-purple-700 cursor-not-allowed opacity-70"
              : "bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
          } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
          onClick={sendGoal}
          disabled={waiting || !user || !profile}
        >
          {waiting ? "Generating Routine..." : "Generate Routine"}
        </button>
        {error && (
          <div className="mt-6 p-4 bg-red-800 text-white rounded-lg flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {/* Pass approval handler to GeneratedRoutine */}
        {routine && (
          <div className="mt-10 pt-8 border-t border-gray-700">
            <GeneratedRoutine
              routineState={[routine, setRoutine]}
              approvedState={[approved, setApproved]}
              onApprove={handleRoutineApproval}
            />
          </div>
        )}

        {/* Saved routine section */}
        <div className="mt-10 pt-8 border-t border-gray-700">
          <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8 sm:p-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 text-white leading-tight flex items-center justify-center gap-2">
              <svg className="w-7 h-7 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17l4 4 4-4m-4-5v9" />
              </svg>
              Your Saved Routine
            </h2>
            {savedRoutine && Array.isArray(savedRoutine) && savedRoutine.length > 0 ? (
              <div className="bg-gray-900 p-4 rounded-xl text-base mb-6 shadow-lg border border-gray-700">
                <div className="flex font-semibold text-purple-300 mb-4 px-1 text-lg">
                  <div className="flex-1 flex flex-row items-center">
                    <span className="w-24 mr-2">Time</span>
                    <span className="flex-1 mr-2">Message</span>
                    <span className="w-16 flex items-center justify-center">Notify</span>
                  </div>
                </div>
                <ul className="space-y-3">
                  {savedRoutine.map((item, idx) => (
                    <li key={idx} className="flex flex-col sm:flex-row sm:items-center bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700">
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
                        <span className="w-24 font-semibold text-purple-400 mr-2">{item.time}</span>
                        <span className="flex-1 text-white mr-2">{item.message}</span>
                      </div>
                      <div className="w-16 flex items-center justify-center mt-2 sm:mt-0 sm:ml-auto">
                        <input type="checkbox" checked={item.notify} readOnly className="accent-purple-500 h-5 w-5" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-900 p-6 rounded-xl text-center text-gray-400 shadow-lg border border-gray-700">
                <svg className="w-10 h-10 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
                </svg>
                <p className="text-lg font-medium">No routine saved.</p>
              </div>
            )}
            <button
              className={`w-full mt-4 py-4 rounded-xl text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                savedRoutine
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
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
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Delete Routine
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard