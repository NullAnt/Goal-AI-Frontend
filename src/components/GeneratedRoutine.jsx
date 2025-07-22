import React from 'react'
import { supabase } from "../supabaseClient";

const GeneratedRoutine = ({ routineState, approvedState, onApprove }) => {
    const [routine, setRoutine] = routineState;
    const [approved, setApproved] = approvedState;

    const handleNotifyChange = (idx, checked) => {
        setRoutine(prev =>
            prev.map((item, i) =>
                i === idx ? { ...item, notify: checked } : item
            )
        );
    };

    if (approved !== null) {
        return <div />;
    }

    return (
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8 sm:p-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 text-white leading-tight flex items-center justify-center gap-2">
                <svg className="w-7 h-7 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17l4 4 4-4m-4-5v9" />
                </svg>
                Generated Routine
            </h2>
            <div className="bg-gray-900 p-4 rounded-xl text-base mb-6 shadow-lg border border-gray-700">
                <div className="flex font-semibold text-purple-300 mb-4 px-1 text-lg">
                    <div className="flex-1 flex flex-row items-center">
                        <span className="w-24 mr-2">Time</span>
                        <span className="flex-1 mr-2">Message</span>
                        <span className="w-16 flex items-center justify-center">Notify</span>
                    </div>
                </div>
                <ul className="space-y-3">
                    {Array.isArray(routine) ? (
                        routine.map((item, idx) => (
                            <li key={idx} className="flex flex-col sm:flex-row sm:items-center bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700">
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center">
                                    <span className="w-24 font-semibold text-purple-400 mr-2">{item.time}</span>
                                    <span className="flex-1 text-white mr-2">{item.message}</span>
                                </div>
                                <div className="w-16 flex items-center justify-center mt-2 sm:mt-0 sm:ml-auto">
                                    <input
                                        type="checkbox"
                                        checked={item.notify}
                                        onChange={e => handleNotifyChange(idx, e.target.checked)}
                                        className="accent-purple-500 h-5 w-5"
                                    />
                                </div>
                            </li>
                        ))
                    ) : (
                        <pre className="whitespace-pre-wrap text-white">{routine}</pre>
                    )}
                </ul>
            </div>
            <div className="mt-4 flex gap-4">
                <button
                    className="flex-1 py-4 rounded-xl text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    onClick={() => onApprove(routine)}
                >
                    Approve Email Reminders
                </button>
                <button
                    className="flex-1 py-4 rounded-xl text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    onClick={() => setApproved(false)}
                >
                    Reject Reminders
                </button>
            </div>
        </div>
    );
};

export default GeneratedRoutine