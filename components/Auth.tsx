
import React, { useState } from 'react';
import type { User } from '../types';
import { Card, Input, Button } from './ui';

interface AuthFormProps {
    title: string;
    buttonText: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    children: React.ReactNode;
    error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ title, buttonText, onSubmit, children, error }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-primary mb-6">{title}</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                {children}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full">{buttonText}</Button>
            </form>
        </Card>
    </div>
);

const AdminSetupForm: React.FC<{ createAdmin: (u: string, p: string) => Promise<boolean> }> = ({ createAdmin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Preencha todos os campos.');
            return;
        }
        await createAdmin(username, password);
    };

    return (
        <AuthForm title="Configuração Inicial" buttonText="Criar Administrador" onSubmit={handleSubmit} error={error}>
            <p className="text-center text-text-secondary mb-4">Bem-vindo! Crie a primeira conta de administrador.</p>
            <Input label="Usuário Admin" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </AuthForm>
    );
};

const LoginForm: React.FC<{ login: (u: string, p: string) => Promise<boolean> }> = ({ login }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (!success) {
            setError('Usuário ou senha inválidos.');
        }
    };
    return (
        <AuthForm title="Login" buttonText="Entrar" onSubmit={handleSubmit} error={error}>
            <Input label="Usuário" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </AuthForm>
    );
};

const ChangePasswordForm: React.FC<{ changePassword: (p: string) => Promise<boolean>, currentUser: User }> = ({ changePassword, currentUser }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 4) {
             setError('A senha deve ter pelo menos 4 caracteres.');
            return;
        }
        await changePassword(password);
    };

    return (
        <AuthForm title="Alterar Senha" buttonText="Salvar Nova Senha" onSubmit={handleSubmit} error={error}>
            <p className="text-center text-text-secondary mb-4">Olá, {currentUser.username}. Por segurança, defina uma nova senha.</p>
            <Input label="Nova Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Input label="Confirmar Nova Senha" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </AuthForm>
    );
};

interface AuthViewProps {
    mode: 'ADMIN_SETUP' | 'LOGIN' | 'CHANGE_PASSWORD';
    createAdmin?: (u: string, p: string) => Promise<boolean>;
    login?: (u: string, p: string) => Promise<boolean>;
    changePassword?: (p: string) => Promise<boolean>;
    currentUser?: User;
}

export const AuthView: React.FC<AuthViewProps> = ({ mode, ...props }) => {
    switch(mode) {
        case 'ADMIN_SETUP':
            return <AdminSetupForm createAdmin={props.createAdmin!} />;
        case 'LOGIN':
            return <LoginForm login={props.login!} />;
        case 'CHANGE_PASSWORD':
            return <ChangePasswordForm changePassword={props.changePassword!} currentUser={props.currentUser!} />;
        default:
            return null;
    }
}
