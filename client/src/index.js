import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, HashRouter} from 'react-router-dom'
import { App } from './App';
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <HashRouter>
            <Routes>
                <Route path='' element={<App/>}/>
            </Routes>
        </HashRouter>
    </React.StrictMode>
);