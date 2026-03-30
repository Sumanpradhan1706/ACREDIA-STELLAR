'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Share2, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
    open: boolean;
    onClose: () => void;
    credential: {
        token_id: string;
        blockchain_hash: string;
        ipfs_hash: string;
        metadata: any;
        student_wallet_address?: string;
    };
}

export default function QRCodeModal({ open, onClose, credential }: QRCodeModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);

    // Generate verification URL
    const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?token=${credential?.token_id || ''}`;

    // Debug: Log credential data when modal opens
    useEffect(() => {
        if (open) {
            console.log('📋 QRCodeModal received credential:', {
                token_id: credential?.token_id,
                blockchain_hash: credential?.blockchain_hash,
                full_credential: credential
            });
        }
    }, [open, credential]);

    // Generate QR code when modal opens
    useEffect(() => {
        if (!open || !credential?.token_id) {
            console.log('⚠️ QR generation skipped:', {
                open,
                hasCanvas: !!canvasRef.current,
                hasTokenId: !!credential?.token_id
            });
            return;
        }

        // Wait for canvas to be ready in the DOM
        const timer = setTimeout(() => {
            if (!canvasRef.current) {
                console.error('❌ Canvas still not ready after timeout');
                return;
            }

            const verificationUrl = `${window.location.origin}/verify?token=${credential.token_id}`;
            const canvas = canvasRef.current;

            console.log('🎨 Generating QR for token:', credential.token_id);
            console.log('🔗 Verification URL:', verificationUrl);
            console.log('📐 Canvas element:', canvas);
            console.log('📏 Canvas dimensions:', canvas.width, 'x', canvas.height);

            // Clear canvas first
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log('🧹 Canvas cleared');
            }

            // Generate QR code
            QRCode.toCanvas(
                canvas,
                verificationUrl,
                {
                    width: 240,
                    margin: 2,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: '#0F766E', // Teal color
                        light: '#FFFFFF',
                    },
                },
                (error) => {
                    if (error) {
                        console.error('❌ Error generating QR code:', error);
                    } else {
                        console.log('✅ QR code generated successfully on canvas');
                        console.log('📊 Canvas after generation:', {
                            width: canvas.width,
                            height: canvas.height,
                            style: canvas.style.cssText
                        });
                    }
                }
            );
        }, 100); // Small delay to ensure DOM is ready

        return () => clearTimeout(timer);
    }, [open, credential?.token_id]);

    const handleDownload = () => {
        if (!canvasRef.current) return;

        // Convert canvas to image and download
        canvasRef.current.toBlob((blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `${credential.metadata?.credentialData?.credentialType || 'credential'}-${credential.token_id}-qr.png`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(verificationUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async () => {
        const credType = credential.metadata?.credentialData?.credentialType || 'Credential';
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Verify My ${credType}`,
                    text: `Scan this QR code or visit the link to verify my ${credType} from ${credential.metadata?.credentialData?.institutionName || 'institution'}`,
                    url: verificationUrl,
                });
            } catch (err) {
                console.log('Share canceled or failed:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-semibold">Share Credential</DialogTitle>
                    <DialogDescription className="text-sm">
                        Anyone can scan this QR code to verify your credential
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* QR Code - Compact */}
                    <div className="flex justify-center bg-linear-to-br from-teal-50 to-white p-4 rounded-lg border border-teal-200">
                        <canvas
                            ref={canvasRef}
                            width={240}
                            height={240}
                            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                        />
                    </div>

                    {/* Token ID - Minimal */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                        <span className="text-xs text-gray-500">Token ID:</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">
                            #{credential?.token_id || 'N/A'}
                        </span>
                    </div>

                    {/* Verification Link - Compact */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Verification Link</label>
                        <div className="flex gap-2">
                            <Input
                                value={verificationUrl}
                                readOnly
                                className="font-mono text-xs h-9 bg-white"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                size="sm"
                                className="shrink-0 h-9 w-9 p-0"
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons - Streamlined */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-sm"
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                        </Button>
                        <Button
                            onClick={handleShare}
                            size="sm"
                            className="flex-1 h-9 bg-teal-600 hover:bg-teal-700 text-sm"
                        >
                            <Share2 className="mr-1.5 h-3.5 w-3.5" />
                            Share
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
