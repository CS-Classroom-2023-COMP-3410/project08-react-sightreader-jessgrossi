{/* hold html to jsx that is loaded through <div id="root"></div> */}
import React from "react"
import { useState, useRef, useEffect } from "react";
import ABCJS from 'abcjs';
import Cookies from "js-cookie";
import "./sightreader.js"; // Ensure Vite bundles it

const App = () => {
    /* dealing with event listeners */
    const [autoContinue, setAutoContinue] = useState(Cookies.get('auto_continue') === '1');
    const [ignoreDuration, setIgnoreDuration] = useState(Cookies.get('ignore_duration') === '1');
    const [profiles, setProfiles] = useState([
        "denver",
        "newprofile",
        "hi",
        "pingus",
        "111"
    ]); 
    const [selectedProfile, setSelectedProfile] = useState(""); // ✅ Define selectedProfile
    const [profileInput, setProfileInput] = useState(""); // ✅ Track input field
    const [isInputVisible, setIsInputVisible] = useState(false); // ✅ Manage input visibility
    const profileSelectRef = useRef(null);
    const profileInputRef = useRef(null);
    const [audioDevices, setAudioDevices] = useState([]); // ✅ Define audioDevices state
    const [selectedDevice, setSelectedDevice] = useState(""); // ✅ Store the selected device
    const devicesSelectRef = useRef(null);
    const fileSelectRef = useRef(null);
    const abcTextareaRef = useRef(null);
    const tuneButtonRef = useRef(null);
    const tempoSelectRef = useRef(null);
    const startButtonRef = useRef(null);
    const resetButtonRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(""); // ✅ Define selectedFile and setSelectedFile
    const [abcContent, setAbcContent] = useState(""); // ✅ stores ABC file content
    const [isStartDisabled, setIsStartDisabled] = useState(true);
    const synthRef = useRef(null);

    useEffect(() => {
        const savedAutoContinue = parseInt(Cookies.get('auto_continue'));
        if (!isNaN(savedAutoContinue)) {
            setAutoContinue(!!savedAutoContinue);
        }
        const savedIgnoreDuration = parseInt(Cookies.get('ignore_duration'));
        if (!isNaN(savedIgnoreDuration)) {
            setIgnoreDuration(!!savedIgnoreDuration);
        }

        const savedFile = Cookies.get('file_select');
        if (savedFile) {
            setFileSelected(savedFile);
        }
    }, []);     // runs once on mount

    // ✅ Fetch available audio devices
    useEffect(() => {
        const getAudioDevices = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === 'audioinput');

                setAudioDevices(audioInputs); // ✅ Store devices in state

                // ✅ Automatically select the first available device
                if (audioInputs.length > 0) {
                    setSelectedDevice(audioInputs[0].deviceId);
                }
            } catch (error) {
                console.error('Error accessing audio devices:', error);
            }
        };

        getAudioDevices();
    }, []); // ✅ Separate effect for fetching devices

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then(() => navigator.mediaDevices.enumerateDevices())
                .then((devices) => {
                    const audioInputs = devices.filter(device => device.kind === 'audioinput');
                    setAudioDevices(audioInputs);
                })
                .catch((error) => {
                    console.error('Error accessing media devices:', error);
                });
        } else {
            alert('This browser is not supported.');
        }
    }, []);

    // ✅ Enable the Start button only when an ABC file is loaded
    useEffect(() => {
        setIsStartDisabled(abcContent.trim() === ""); // ✅ Enable when ABC data is loaded
    }, [abcContent]);

    // Handlers
    const handleAutoContinueClick = () => {
        setAutoContinue((prev) => {
            const newValue = !prev;
            Cookies.set('auto_continue', newValue ? 1 : 0);
            return newValue;
        });
    };

    const handleIgnoreDurationClick = () => {
        setIgnoreDuration((prev) => {
            const newValue = !prev;
            Cookies.set('ignore_duration', newValue ? 1 : 0);
            return newValue;
        });
    };

    const handleIgnoreDurationChange = () => {
        setIgnoreDuration((prev) => {
            const newValue = !prev;
            Cookies.set('ignore_duration', newValue ? 1 : 0);
            return newValue;
        });
    };

    const handleProfileInputKeyDown = async (e) => {
        if (!profileInputRef.current) return;

        if (e.key === 'Escape') {
            setProfileInput(""); // ✅ Clear state instead of modifying DOM directly
            setIsInputVisible(false);
        } else if (e.key === 'Enter' && profileInput.trim() !== "") {
            try {
                const response = await fetch(`/profile/save/${profileInput}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    console.log('Success saving profile!');

                    // ✅ Update profiles state instead of manually modifying the DOM
                    setProfiles((prevProfiles) => [...prevProfiles, profileInput]);

                    // ✅ Reset input field
                    setProfileInput("");
                    setIsInputVisible(false);
                } else {
                    console.log('Error saving profile!');
                }
            } catch (error) {
                console.error('Error saving profile:', error);
            }
        }
    };

    const handleDeviceSelectChange = async (e) => {
        const selectedDeviceId = e.target.value;
        if (selectedDeviceId) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: selectedDeviceId } }
                });

                console.log('MediaStream obtained:', stream);
                // Update state or context accordingly
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        }
    };

    const handleFileSelectChange = (e) => {
        const selectedFile = e.target.value;
        setFileSelected(selectedFile); // Update React state
        Cookies.set('file_select', selectedFile); // Save to cookies
        console.log('File selection changed:', selectedFile);
        _file_select_change(); // Call the function after updating the state
    };

    // ✅ Handles file selection
    const handleFileChange = async (event) => {
        const fileName = event.target.value;
        setSelectedFile(fileName);

        if (fileName) {
            try {
                // ✅ Construct the correct absolute URL
                const fileUrl = `${window.location.origin}/music/${fileName}`; 
                console.log("Fetching ABC file from:", fileUrl); // ✅ Debugging URL

                // ✅ Fetch the ABC file from the /public/music/ folder
                const response = await fetch(fileUrl);
                if (!response.ok) throw new Error("File not found");

                const data = await response.text();
                console.log("ABC File Content Loaded:", data);
                setAbcContent(data); // ✅ Store the file content in state
            } catch (error) {
                console.error("Error loading ABC file:", error);
                setAbcContent("Error loading file.");
            }
        } else {
            setAbcContent(""); // ✅ Clear content if no file is selected
        }
    };

    // ✅ Render ABC notation when `abcContent` updates
    useEffect(() => {
        if (abcContent) {
            console.log("Rendering ABC Notation...");
            ABCJS.renderAbc("abc-music-display", abcContent); // ✅ Render ABC notation
        }
    }, [abcContent]);

    const handleAbcTextareaChange = () => {
        console.log('ABC textarea changed');
        // Implement abc_textarea_change()
    };

    const handleTuneButtonClick = () => {
        if (tuneButtonRef.current) {
            if (tuneButtonRef.current.classList.contains('active')) {
                tuneButtonRef.current.classList.remove('active');
            } else {
                tuneButtonRef.current.classList.add('active');
            }
        }
        console.log('Tune button clicked');
        // Implement start/stop logic
    };

    const handleTempoSelectChange = () => {
        console.log('Tempo selection changed');
        // Implement load_abc(original_loaded_abc)
    };

    const handleStartButtonClick = async () => {
        console.log("Start button clicked");
    
        if (!abcContent.trim()) {
            console.error("No ABC notation loaded.");
            return;
        }
    
        try {
            // ✅ Render ABC notation and check if it returns a valid object
            const visualObjs = ABCJS.renderAbc("abc-music-display", abcContent, {});
            console.log("Generated visualObjs:", visualObjs); // ✅ Debugging
    
            if (!visualObjs || visualObjs.length === 0 || !visualObjs[0]) {
                throw new Error("Failed to render ABC notation. `visualObj` is undefined.");
            }
    
            const visualObj = visualObjs[0]; // ✅ Extract valid visualObj
            console.log("Using visualObj:", visualObj); // ✅ Debugging
    
            // ✅ Initialize ABCJS Synth for audio playback
            const synth = new ABCJS.synth.CreateSynth();
            synthRef.current = synth; // ✅ Store synth instance in ref
    
            // ✅ Prepare and play the music
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
            // ✅ Ensure ABCJS Synth is correctly initialized
            await synth.init({ audioContext, visualObj });
    
            await synth.prime(); // ✅ Prepare sound before playing
            synth.start(); // ✅ Play music
    
            console.log("Music started!");
        } catch (error) {
            console.error("Error playing ABC music:", error);
        }
    };
    

    const handleResetButtonClick = () => {
        console.log('Reset button clicked');
        // Implement reset logic
    };

    return (
        <div className="container">
            <h3>ABC Sightreader</h3>

            <div className="container">
                <div className="row">
                    <div className="col-12" id="status" title="status">
                        1. Select your mic 2. Select your ABC file 3. Press start
                    </div>
                </div>

                <div className="row controls">
                <div className="col-12">

                    <label htmlFor="devices">Profile:</label>
                    {/* ✅ Fixed Dropdown for Profile Selection */}
                    <select 
                        id="profile_select" 
                        value={selectedProfile} 
                        onChange={(e) => setSelectedProfile(e.target.value)}
                    >
                        {/* ✅ Default options */}
                        <option value="">Default</option>
                        <option value="new">Create new profile</option>

                        {/* ✅ Hardcoded Profile Options */}
                        <option value="denver">denver</option>
                        <option value="newprofile">newprofile</option>
                        <option value="hi">hi</option>
                        <option value="pingus">pingus</option>
                        <option value="111">111</option>

                        {/* ✅ Dynamic Profiles from `profiles` */}
                        {profiles && profiles.length > 0 ? (
                            profiles.map((profile, index) => (
                                <option key={index} value={profile}>
                                    {profile}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>No profiles found</option>
                        )}
                    </select>

                    <label htmlFor="devices">Microphone:</label>
                    <select ref={devicesSelectRef} id="devices_select">
                        {audioDevices.length > 0 ? (
                            audioDevices.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || 'Unknown Device'}
                            </option>
                            ))
                        ) : (
                        <option value="">No audio devices found</option>
                        )}
                    </select>

                    <label htmlFor="file">File:</label>
                    <select id="file" value={selectedFile} onChange={handleFileChange}>
                        <option value="">---Custom ABC---</option>
                        {/* ✅ Hardcoded ABC File Options */}
                        {[
                            "beginner.pls",
                            "cecilio-lesson1-open-strings.abc",
                            "cecilio-lesson2-first-position.abc",
                            "cecilio-lesson2-twinkle-twinkle-little-star.abc",
                            "cecilio-lesson3-exercise-1.abc",
                            "cecilio-lesson3-exercise-2.abc",
                            "cecilio-lesson3-exercise-3.abc",
                            "cecilio-lesson3-exercise-4.abc",
                            "cecilio-lesson3-jingle-bells.abc",
                            "cecilio-lesson3-mary-had-a-little-lamb.abc",
                            "cecilio-lesson4-camptown-races.abc",
                            "cecilio-lesson4-lightly-row.abc",
                            "cecilio-lesson4-russian-dance-tune.abc",
                            "cecilio-lesson5-eighth-notes.abc",
                            "cecilio-lesson5-hungarian-folk-song-1.abc",
                            "cecilio-lesson5-the-old-gray-goose.abc",
                            "cecilio-lesson6-first-position-d-string.abc",
                            "cecilio-lesson6-ode-to-joy.abc",
                            "cecilio-lesson6-scherzando.abc",
                            "cecilio-lesson7-can-can.abc",
                            "cecilio-lesson7-country-gardens.abc",
                            "cecilio-lesson7-gavotte.abc",
                            "cecilio-lesson8-dixie.abc",
                            "cecilio-lesson8-largo.abc",
                            "hot-cross-buns.abc",
                            "lesson1-open-string-exercise-1.abc",
                            "lesson1-open-string-exercise-2.abc",
                            "lesson1-open-string-exercise-3.abc",
                            "lesson1-open-string-exercise-4.abc",
                            "lesson1-open-string-exercise-5.abc",
                            "lesson1-open-string-exercise-6.abc",
                            "lesson2-1st-finger-exercise-1.abc",
                            "lesson2-1st-finger-exercise-2.abc",
                            "lesson2-1st-finger-exercise-3.abc",
                            "lesson2-1st-finger-exercise-4.abc",
                            "lesson2-1st-finger-exercise-5.abc",
                            "lesson2-1st-finger-exercise-6.abc"
                        ].map((file, index) => (
                            <option key={index} value={file}>
                                {file.replace(".abc", "").replace("-", " ")} {/* ✅ Beautify file names */}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="tempo">Tempo:</label>
                    <select id="tempo">
                        <option value="">inherit</option>
                        <option value="30">30</option>
                        <option value="60">60</option>
                        <option value="90">90</option>
                        <option value="120">120</option>
                        <option value="180">180</option>
                        <option value="240">240</option>
                    </select>

                    <button
                        ref={startButtonRef}
                        id="start_button"
                        onClick={handleStartButtonClick}
                        disabled={isStartDisabled} // ✅ Dynamically enable/disable
                        title="Enable mic and begin playing along to sheet music."
                    >
                        Start
                    </button>

                    <button ref={resetButtonRef} id="reset_button" onClick={handleResetButtonClick}>
                        Reset
                    </button>

                    <button ref={tuneButtonRef} id="tune_button" onClick={handleTuneButtonClick}>
                        Tune
                    </button>
                </div>
            </div>

            {/* ✅ Display ABC Content */}
            <div id="abc-music-display"></div>

            <div className="row" id="abc-textarea-container">
                <div className="col-12">
                    <textarea id="abc-textarea"></textarea>
                </div>
            </div>

            <div className="row main-display">
                <div className="row top-info">
                    <div id="current-playlist-position" title="Playlist position." className="col-4 left">
                        -
                    </div>
                    <div id="qpm-display" title="QPM" className="span4 center">
                        -
                    </div>
                    <div className="col-4 right">
                        <span id="current-score" title="Your current score.">-</span>
                        <span id="score-stats" title="Score statistics."></span>
                    </div>
                </div>
                <div className="col-12" id="notation"></div>
                <span id="current-note" title="Expected and actual note detected on the microphone.">-</span>
                <span id="current-volume" title="Microphone volume.">-</span>
                <div id="midi" style={{ display: "none" }}></div>
                <span id="count-down"></span>
                <span id="loaded-filename">-</span>
            </div>

            <div className="row controls">
                <div className="col-12 keyboard-legend">
                    <span className="cb-field">
                        <input id="auto-continue" type="checkbox" />
                        <label htmlFor="auto-continue" title="Once score is above average, immediately move on to next playlist item.">Auto-Continue</label>
                    </span>
                    <span className="cb-field">
                        <input id="ignore-duration" type="checkbox" />
                        <label htmlFor="ignore-duration" title="If checked, will score a note if it's met and will not check duration.">Ignore Duration</label>
                    </span>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <ol id="playlist" className="list-group"></ol>
                </div>
            </div>
        </div>

        {/* Modal */}
        <div className="modal fade" id="message-model" role="dialog">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-body" style={{ textAlign : 'center' }}></div>
                </div>
            </div>
        </div>
    </div>
    );    
};

export default App;