import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PlotViewer from '../components/PlotViewer';

const PATIENT_IDS = ['AP_01', 'AP_02', 'AP_03'];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [signedUrl, setSignedUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [savedEvents, setSavedEvents] = useState<any>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!selectedPatient) return;

      const { data, error } = await supabase.storage
        .from('plots')
        .createSignedUrl(`${selectedPatient}.json.gz`, 60);

      if (error) {
        console.error(error);
        return;
      }

      setSignedUrl(data.signedUrl);
    }

    fetchSignedUrl();
  }, [selectedPatient]);

  useEffect(() => {
    async function fetchEventFeedback() {
      if (!selectedPatient || !user) return;

      const { data, error } = await supabase
        .from('annotation_feedback')
        .select('event_id, is_correct')
        .eq('user_id', user.id)
        .eq('patient_id', selectedPatient);

      if (!error && data) {
        const feedbackMap = Object.fromEntries(data.map((d) => [d.event_id, d.is_correct]));
        setSavedEvents(feedbackMap);
      }
    }

    fetchEventFeedback();
  }, [selectedPatient, user]);

  useEffect(() => {
    if (!selectedEvent || !savedEvents) return;
    const val = savedEvents[selectedEvent];
    if (val !== undefined) {
      setIsCorrect(val);
    } else {
      setIsCorrect(null);
    }
  }, [selectedEvent, savedEvents]);

  async function submitFeedback(answer: boolean) {
    if (!selectedEvent || !selectedPatient || !user) return;

    const { error } = await supabase
      .from('annotation_feedback')
      .upsert([
        {
          user_id: user.id,
          patient_id: selectedPatient,
          event_id: selectedEvent,
          is_correct: answer,
        },
      ]);

    if (error) {
      alert('Failed to save feedback: ' + error.message);
    } else {
      setIsCorrect(answer);
      setSavedEvents((prev: any) => ({ ...prev, [selectedEvent]: answer }));
    }
  }

  async function signIn() {
    const email = prompt('Email:');
    const password = prompt('Password:');
    if (!email || !password) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Patient's Data</h1>

      {!user ? (
        <button onClick={signIn}>Sign In</button>
      ) : (
        <>
          <select onChange={(e) => setSelectedPatient(e.target.value)} value={selectedPatient}>
            <option value="">Select Patient ID</option>
            {PATIENT_IDS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          {signedUrl && <PlotViewer signedUrl={signedUrl} />}

          {selectedEvent && (
            <div>
              <p>Is this event correct?</p>
              <button
                onClick={() => submitFeedback(true)}
                style={{ backgroundColor: isCorrect === true ? 'green' : undefined }}
              >✅ Yes</button>
              <button
                onClick={() => submitFeedback(false)}
                style={{ backgroundColor: isCorrect === false ? 'red' : undefined }}
              >❌ No</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
