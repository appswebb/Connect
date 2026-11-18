"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Check, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import Avatar from "./ConnectAvatar";
import type { Profile } from "../types/connect";

type Props = {
  busy: boolean;
  displayNameSetting: string;
  setDisplayNameSetting: Dispatch<SetStateAction<string>>;
  saveDisplayName: (event: FormEvent<HTMLFormElement>) => void;
  usernameSetting: string;
  setUsernameSetting: Dispatch<SetStateAction<string>>;
  genderSetting: string;
  setGenderSetting: Dispatch<SetStateAction<string>>;
  genderDescriptionSetting: string;
  setGenderDescriptionSetting: Dispatch<SetStateAction<string>>;
  saveIdentity: (event: FormEvent<HTMLFormElement>) => void;
  lookingForSetting: string;
  setLookingForSetting: Dispatch<SetStateAction<string>>;
  saveMatchingPreferences: (event: FormEvent<HTMLFormElement>) => void;
  sendPasswordReset: () => void | Promise<void>;
  blockedPeople: Profile[];
  unblockUser: (userId: string) => void | Promise<void>;
  deletionDue: string;
  cancelDeletion: () => void | Promise<void>;
  requestDeletion: () => void | Promise<void>;
};

export default function ConnectSettings(props: Props) {
  const {
    busy, displayNameSetting, setDisplayNameSetting, saveDisplayName,
    usernameSetting, setUsernameSetting, genderSetting, setGenderSetting,
    genderDescriptionSetting, setGenderDescriptionSetting, saveIdentity,
    lookingForSetting, setLookingForSetting, saveMatchingPreferences,
    sendPasswordReset, blockedPeople, unblockUser, deletionDue,
    cancelDeletion, requestDeletion,
  } = props;

  return (
    <>
      <div className="heading">
        <div>
          <small>AJUSTES DA CONTA</small>
          <h1>Configurações.</h1>
          <p>Gerencie seus dados, preferências, segurança e privacidade.</p>
        </div>
      </div>
      <div className="settings-panel profile-settings-unified">
        <section className="settings-section profile-identity-editor">
          <div>
            <UserRound />
            <span><strong>Nome de exibição</strong><small>Este é o nome que aparece no seu perfil, publicações e conversas. Não altera seu @.</small></span>
          </div>
          <form onSubmit={saveDisplayName}>
            <label>Seu nome
              <input value={displayNameSetting} onChange={(event) => setDisplayNameSetting(event.target.value)} maxLength={40} placeholder="Como deseja aparecer no CONNECT?" autoComplete="name" />
            </label>
            <button type="submit" className="primary" disabled={busy}>Salvar nome <Check size={15} /></button>
          </form>
        </section>

        <section className="settings-section profile-identity-editor">
          <div>
            <UserRound />
            <span><strong>Editar identificador e gênero</strong><small>Você pode atualizar seu @ e suas informações de identidade quando quiser. O @ precisa estar disponível.</small></span>
          </div>
          <form onSubmit={saveIdentity}>
            <label>Identificador (@)
              <input value={usernameSetting} onChange={(event) => setUsernameSetting(event.target.value)} maxLength={20} autoCapitalize="none" autoCorrect="off" placeholder="seu_identificador" />
            </label>
            <label>Gênero
              <select value={genderSetting} onChange={(event) => setGenderSetting(event.target.value)}>
                <option value="woman">Mulher</option>
                <option value="man">Homem</option>
                <option value="non_binary">Pessoa não binária</option>
                <option value="self_described">Outro gênero</option>
                <option value="prefer_not_to_say">Prefiro não informar</option>
              </select>
            </label>
            {genderSetting === "self_described" && (
              <label>Descreva seu gênero
                <input value={genderDescriptionSetting} onChange={(event) => setGenderDescriptionSetting(event.target.value)} maxLength={80} placeholder="Como deseja se identificar?" />
              </label>
            )}
            <button type="submit" className="primary" disabled={busy}>Salvar identidade <Check size={15} /></button>
          </form>
        </section>

        <p className="profile-hint"><ShieldCheck size={16} /> Seu @ é exclusivo e não pode ser usado por outra pessoa.</p>

        <section className="settings-section">
          <div>
            <Users />
            <span><strong>Preferências de conexão</strong><small>Escolha quem deseja conhecer. As preferências dos dois lados continuam sendo respeitadas.</small></span>
          </div>
          <form onSubmit={saveMatchingPreferences}>
            <label>Quero conhecer
              <select value={lookingForSetting} onChange={(event) => setLookingForSetting(event.target.value)}>
                <option value="any">Qualquer gênero</option>
                <option value="woman">Mulheres</option>
                <option value="man">Homens</option>
                <option value="non_binary">Pessoas não binárias</option>
                <option value="self_described">Outros gêneros</option>
                <option value="prefer_not_to_say">Pessoas que preferem não informar</option>
              </select>
            </label>
            <button type="submit" className="primary" disabled={busy}>Salvar preferências <Check size={15} /></button>
          </form>
        </section>

        <section className="settings-section">
          <div>
            <ShieldCheck />
            <span><strong>Segurança da conta</strong><small>Proteja seu acesso e gerencie pessoas bloqueadas.</small></span>
          </div>
          <button type="button" className="secondary" onClick={() => void sendPasswordReset()}>Redefinir senha por e-mail</button>
          <div className="blocked-list">
            <strong>Pessoas bloqueadas</strong>
            {blockedPeople.map((person) => (
              <div key={person.id}>
                <Avatar p={person} size="small" />
                <span>{person.display_name}<small>@{person.username}</small></span>
                <button type="button" className="secondary" onClick={() => void unblockUser(person.id)}>Desbloquear</button>
              </div>
            ))}
            {!blockedPeople.length && <small>Ninguém bloqueado por enquanto.</small>}
          </div>
        </section>

        <section className="settings-section danger-zone">
          <div>
            <Trash2 />
            <span><strong>Excluir minha conta</strong><small>Você terá 7 dias para cancelar o pedido antes da exclusão definitiva.</small></span>
          </div>
          {deletionDue ? (
            <>
              <p className="deletion-pending">Exclusão programada para {new Date(deletionDue).toLocaleString("pt-BR")}. Você ainda pode cancelar.</p>
              <button type="button" className="secondary" onClick={() => void cancelDeletion()}>Cancelar exclusão e recuperar conta</button>
            </>
          ) : (
            <button type="button" className="danger-button" onClick={() => void requestDeletion()}>Solicitar exclusão da conta</button>
          )}
        </section>
      </div>
    </>
  );
}
