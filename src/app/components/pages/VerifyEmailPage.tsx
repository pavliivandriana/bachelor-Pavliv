import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/auth', { replace: true }); }, [navigate]);
  return null;
}
