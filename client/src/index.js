import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router, Routes, Route, HashRouter} from 'react-router-dom'
import { App } from './App';
import { Header } from './components/Header';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <HashRouter>
            <Header/>
            <Routes>
                <Route path='' element={<App/>}/>
            </Routes>
        </HashRouter>
    </React.StrictMode>
);