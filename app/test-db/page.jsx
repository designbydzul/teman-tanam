'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestDB() {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSpecies() {
      try {
        const { data, error } = await supabase
          .from('plant_species')
          .select('*');

        if (error) throw error;

        setSpecies(data || []);
      } catch (err) {
        console.error('Supabase error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSpecies();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#2D5016' }}>
        Supabase Connection Test
      </h1>

      {loading && (
        <p style={{ color: '#666' }}>Loading...</p>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FEE2E2',
          borderRadius: '8px',
          color: '#DC2626',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{
            padding: '16px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            color: '#16A34A',
            marginBottom: '20px'
          }}>
            Connection successful! Found {species.length} species
          </div>

          {species.length > 0 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#333' }}>
                Plant Species:
              </h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {species.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <strong>{item.name || item.common_name || 'Unknown'}</strong>
                    {item.scientific_name && (
                      <span style={{ color: '#666', marginLeft: '8px', fontStyle: 'italic' }}>
                        ({item.scientific_name})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '30px', padding: '16px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>Connection Info:</h3>
        <p style={{ fontSize: '12px', color: '#888', wordBreak: 'break-all' }}>
          URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
        </p>
      </div>
    </div>
  );
}
