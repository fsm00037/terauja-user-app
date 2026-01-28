export const API_URL = 'http://127.0.0.1:8001';
import { getCurrentPatient } from './auth';

export type Assignment = {
    id: number;
    status: 'active' | 'paused' | 'completed';
    answers: any;
    assigned_at: string;
    start_date?: string;
    end_date?: string;
    frequency_type?: string;
    frequency_count?: number;
    window_start?: string;
    window_end?: string;
    deadline_hours?: number;
    next_scheduled_at?: string;
    questionnaire: {
        id: number;
        title: string;
        description: string;
        icon?: string;
        questions: any[];
    }
}

function getAuthHeader(): Record<string, string> {
    const patient = getCurrentPatient();
    return patient?.token ? { 'Authorization': `Bearer ${patient.token}` } : {};
}

export interface QuestionnaireCompletion {
    id: number;
    assignment_id: number;
    patient_id: number;
    questionnaire_id: number;
    status: 'pending' | 'completed' | 'missed' | 'sent';
    scheduled_at: string;
    deadline_hours?: number;
    questionnaire: {
        title: string;
        icon: string;
        description?: string;
        questions?: any[];
    };
}

const ensureUTC = (dateStr: string) => {
    if (!dateStr) return dateStr;
    // If it doesn't end with Z and doesn't have an offset (like +01:00), append Z
    if (!dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr)) {
        return `${dateStr}Z`;
    }
    return dateStr;
};

export async function getAssignments(accessCode: string): Promise<Assignment[]> {
    try {
        const res = await fetch(`${API_URL}/assignments/patient/${accessCode}`, {
            headers: { ...getAuthHeader() }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((a: any) => ({
            ...a,
            assigned_at: ensureUTC(a.assigned_at),
            window_start: ensureUTC(a.window_start),
            window_end: ensureUTC(a.window_end),
            next_scheduled_at: ensureUTC(a.next_scheduled_at)
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function getPendingAssignments(): Promise<QuestionnaireCompletion[]> {
    try {
        const res = await fetch(`${API_URL}/assignments/my-pending`, {
            headers: { ...getAuthHeader() }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((c: any) => ({
            ...c,
            scheduled_at: ensureUTC(c.scheduled_at)
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function submitAssignment(assignmentId: number, answers: any[]): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/assignments/${assignmentId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(answers),
        });
        return res.ok;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export interface ChatMessage {
    id: number;
    patient_id: number;
    content: string;
    is_from_patient: boolean;
    created_at: string;
}

export async function getMessages(patientId: number | string): Promise<ChatMessage[]> {
    try {
        const res = await fetch(`${API_URL}/messages/${patientId}`, {
            headers: { ...getAuthHeader() }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function sendMessage(patientId: number | string, content: string): Promise<ChatMessage | null> {
    try {
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ patient_id: patientId, content, is_from_patient: true }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function sendHeartbeat(): Promise<void> {
    try {
        await fetch(`${API_URL}/heartbeat`, {
            method: 'POST',
            headers: { ...getAuthHeader() }
        });
    } catch (e) {
        // Silent fail
    }
}

export async function logout(): Promise<void> {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { ...getAuthHeader() }
        });
    } catch (e) {
        console.error(e);
    }
}

export async function getPatientStatus(): Promise<{ is_online: boolean; psychologist_is_online: boolean } | null> {
    try {
        const res = await fetch(`${API_URL}/patient/status`, {
            headers: { ...getAuthHeader() }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function getPatientProfile(): Promise<any | null> {
    try {
        const res = await fetch(`${API_URL}/patient/me`, {
            headers: { ...getAuthHeader() }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}
