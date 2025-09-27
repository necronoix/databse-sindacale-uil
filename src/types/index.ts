export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Iscritto {
  id: number;
  cognome: string;
  nome: string;
  iscrizione?: string;
  invio?: string;
  prot?: string;
  ruolo?: string;
  istituto?: string;
  tipologia?: string;
  documento?: string;
  note_attuale?: string;
  dpt?: string;
  prov?: string;
  importoritenuta?: number;
  meserata?: string;
  annorata?: string;
  uff_servizio?: string;
  descrizione?: string;
  cod_mecc?: string;
  indirizzo?: string;
  cap?: string;
  localita?: string;
  qual_liv?: string;
  tiporit?: string;
  telefono?: string;
  email_personale?: string;
  trasferimento?: string;
  pensione?: string;
  contratto?: string;
  scadenzacontratto?: string;
  annoiscrizione?: string;
  rsu_tas?: string;
  riferimento?: string;
  data_iscrizione: string;
  data_ultima_modifica: string;
  iscritto_da_user_id?: number;
  modificato_da_user_id?: number;
}

export interface LogModifica {
  id: number;
  iscritto_id: number;
  campo_modificato: string;
  valore_precedente?: string;
  valore_nuovo?: string;
  data_modifica: string;
  utente_id?: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface SearchFilters {
  cognome?: string;
  nome?: string;
  ruolo?: string;
  istituto?: string;
  prov?: string;
  annoiscrizione?: string;
  rsu_tas?: string;
  contratto?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalIscritti: number;
  nuoviIscrittiAnno: number;
  iscrittiPerRuolo: Record<string, number>;
  iscrittiPerProvincia: Record<string, number>;
  iscrittiPerAnno: Record<string, number>;
  ultimiIscritti: Iscritto[];
}