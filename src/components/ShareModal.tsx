import { useState } from 'react';
import { Modal, ModalDialog, Typography, Button, Input, IconButton } from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    shareId: string;
    isLoading?: boolean;
}

export const ShareModal = ({ open, onClose, shareId, isLoading }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    
    // Construct the share URL on the frontend
    const shareUrl = shareId ? `${window.location.origin}/new/${shareId}` : '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog
                variant="outlined"
                role="alertdialog"
                sx={{ maxWidth: 500, width: '90%' }}
            >
                <div className="flex justify-between items-center mb-4">
                    <Typography level="h4">Share Text</Typography>
                    <IconButton variant="plain" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </div>
                
                {isLoading ? (
                    <div className="text-center py-8">
                        <Typography>Creating share link...</Typography>
                    </div>
                ) : (
                    <>
                        <Typography level="body-md" className="mb-4">
                            Share this link with others to let them view your text:
                        </Typography>
                        
                        <div className="flex gap-2 mb-4">
                            <Input
                                value={shareUrl}
                                readOnly
                                sx={{ flexGrow: 1 }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleCopy}
                                startDecorator={copied ? <CheckIcon /> : <ContentCopyIcon />}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <Button variant="plain" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </>
                )}
            </ModalDialog>
        </Modal>
    );
};
