import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '../types';

interface NotesSectionProps {
  notes: Note[];
  closed: boolean;
  onAddNote: (content: string) => void;
  onDeleteNote: (id: number) => void;
}

export function NotesSection({ notes, closed, onAddNote, onDeleteNote }: NotesSectionProps) {
  const [text, setText] = useState('');

  function addNote() {
    if (!text.trim()) return;
    onAddNote(text.trim());
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  }

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Rozkminki</h2>
        <span className="section-count">{notes.length}</span>
      </div>

      {!closed && (
        <div className="note-input-row">
          <textarea
            className="note-textarea"
            placeholder="Co chodzi Ci po głowie?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <motion.button
            className="btn-add-note"
            onClick={addNote}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!text.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </motion.button>
        </div>
      )}

      <div className="notes-list">
        <AnimatePresence mode="popLayout">
          {notes.length === 0 && (
            <motion.p className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Brak rozkmin. Napisz coś!
            </motion.p>
          )}
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              className="note-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              layout
            >
              <p className="note-text">{note.content}</p>
              <div className="note-footer">
                <span className="note-time">
                  {new Date(note.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {!closed && (
                  <motion.button
                    className="btn-icon btn-delete"
                    onClick={() => onDeleteNote(note.id)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
