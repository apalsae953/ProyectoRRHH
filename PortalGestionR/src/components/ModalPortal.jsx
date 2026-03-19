import { createPortal } from 'react-dom';

const ModalPortal = ({ children }) => {
    const root = document.getElementById('modal-root');
    if (!root) return children;
    return createPortal(children, root);
};

export default ModalPortal;
