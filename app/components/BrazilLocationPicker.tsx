"use client";

import { useEffect, useState } from "react";

const BRAZIL_STATES: Record<string,string> = {
  AC:"Acre", AL:"Alagoas", AP:"Amapá", AM:"Amazonas", BA:"Bahia", CE:"Ceará", DF:"Distrito Federal",
  ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão", MT:"Mato Grosso", MS:"Mato Grosso do Sul",
  MG:"Minas Gerais", PA:"Pará", PB:"Paraíba", PR:"Paraná", PE:"Pernambuco", PI:"Piauí",
  RJ:"Rio de Janeiro", RN:"Rio Grande do Norte", RS:"Rio Grande do Sul", RO:"Rondônia",
  RR:"Roraima", SC:"Santa Catarina", SP:"São Paulo", SE:"Sergipe", TO:"Tocantins"
};

type Props = {
  stateCode: string;
  city: string;
  onChange: (stateCode: string, city: string) => void;
  allowAnyState?: boolean;
  allowAnyCity?: boolean;
  compact?: boolean;
};

export default function BrazilLocationPicker({
  stateCode, city, onChange, allowAnyState = false, allowAnyCity = false, compact = false
}: Props) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!stateCode) {
      setCities([]);
      setLoading(false);
      setError("");
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/" + encodeURIComponent(stateCode) + "/municipios?orderBy=nome")
      .then(response => {
        if (!response.ok) throw new Error("Não foi possível carregar os municípios.");
        return response.json();
      })
      .then((rows: Array<{ nome: string }>) => {
        if (active) setCities(rows.map(row => row.nome));
      })
      .catch(() => {
        if (active) {
          setCities([]);
          setError("Não foi possível carregar as cidades. Verifique sua conexão e tente novamente.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stateCode]);

  const cityOptions = city && !cities.includes(city) ? [city, ...cities] : cities;

  return (
    <div className={compact ? "brazil-location-picker compact" : "brazil-location-picker"}>
      <label>
        Estado
        <select value={stateCode} onChange={event => onChange(event.target.value, "")}>
          <option value="">{allowAnyState ? "Qualquer estado" : "Selecione o estado"}</option>
          {Object.entries(BRAZIL_STATES).map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
        </select>
      </label>
      <label>
        Cidade
        <select value={city} disabled={!stateCode || loading || (!cities.length && Boolean(error))} onChange={event => onChange(stateCode, event.target.value)}>
          <option value="">{!stateCode ? "Escolha um estado primeiro" : loading ? "Carregando cidades..." : allowAnyCity ? "Qualquer cidade" : "Selecione a cidade"}</option>
          {cityOptions.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
      {error && <small className="location-picker-error">{error}</small>}
    </div>
  );
}
