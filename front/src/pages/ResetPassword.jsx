import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import styles from './ResetPassword.module.css'
import api from '../api/axios';

export function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();


    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    function togglePassword() {
        setShowPassword(!showPassword);
    }
    function toggleConfirmPassword() {
        setShowConfirmPassword(!showConfirmPassword);
    }

    const passwordsMatch = (password === confirmPassword);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('accounts/login/', {

                password: password
            });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

        } catch (error) {
            console.error("Login Error:", error.response?.data);
            navigate('/dumbahh');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.ResetPassword}>
                <div className={styles.titleContainer}>
                    <img src="/images/lock-key.png" className={styles.lockIcon} />
                    <h3 className={styles.Title}>Change your Password</h3>
                    <h6 className={styles.appTitle}>Enter a new password below to change  the password </h6>
                </div>

                <form className={styles.bodyContainer} onSubmit={handleSubmit}>

                    <p className={styles.inputFieldTitle}>NEW PASSWORD*</p>
                    <div className={styles.inputWrapper}>

                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={styles.inputWrapperText}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                        <span>
                            <button type="button" className={styles.eyeButton} onClick={togglePassword}>
                                <img src="/images/eye-open.png" className={styles.eyeIcon} />
                            </button>
                        </span>
                    </div>

                    <p className={styles.inputFieldTitle}>CONFIRM PASSWORD*</p>
                    <div className={styles.inputWrapper}>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className={styles.inputWrapperText}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} />

                        <span>

                            <button type="button" className={styles.eyeButton} onClick={toggleConfirmPassword}>
                                <img src="/images/eye-open.png" className={styles.eyeIcon} />
                            </button>
                        </span>
                    </div>

                    <label className={` ${passwordsMatch ? styles.emptyText : styles.Text}`}>Password do not match!</label>






                    <button type='submit' className={styles.ResetPasswordButton} >

                        Reset Password
                    </button>

                    <div className={styles.supportContainer}>
                        Technical issues?
                        <a href="mailto:support@example.com" className={styles.supportLink}>Contact Support</a>
                    </div>
                </form>


            </div>
            <footer className={styles.footer}>© 2026 École Supérieure en Informatique de Sidi Bel Abbès</footer>
        </div>
    );
}
