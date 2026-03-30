'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, CheckCircle2, Plus, X } from 'lucide-react';
import { issueCredential, type CredentialData } from '@/lib/credentialService';
import { isValidAddress } from '@/lib/contracts';
import { toast } from 'sonner';

interface Subject {
    id: string;
    name: string;
    marks: string;
    maxMarks: string;
    grade?: string;
}

interface CredentialUploadFormProps {
    institutionId: string;
    institutionName: string;
    institutionWallet: string;
    account: any;
    onSuccess?: () => void;
}

export function CredentialUploadForm({
    institutionId,
    institutionName,
    institutionWallet,
    account,
    onSuccess,
}: CredentialUploadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [formData, setFormData] = useState({
        studentName: '',
        studentWallet: '',
        studentEmail: '',
        credentialType: 'diploma',
        degree: '',
        major: '',
        gpa: '',
        issueDate: new Date().toISOString().split('T')[0],
    });

    const addSubject = () => {
        const newSubject: Subject = {
            id: Date.now().toString(),
            name: '',
            marks: '',
            maxMarks: '100',
            grade: '',
        };
        setSubjects([...subjects, newSubject]);
    };

    const removeSubject = (id: string) => {
        setSubjects(subjects.filter(subject => subject.id !== id));
    };

    const updateSubject = (id: string, field: keyof Subject, value: string) => {
        setSubjects(subjects.map(subject =>
            subject.id === id ? { ...subject, [field]: value } : subject
        ));
    };

    const calculatePercentage = (marks: string, maxMarks: string) => {
        const m = parseFloat(marks);
        const max = parseFloat(maxMarks);
        if (isNaN(m) || isNaN(max) || max === 0) return '';
        return ((m / max) * 100).toFixed(2) + '%';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PDF, JPG, or PNG files only.');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB.');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }

        toast.success('File selected successfully');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        if (!formData.studentWallet || !isValidAddress(formData.studentWallet)) {
            toast.error('Please enter a valid student wallet address');
            return;
        }

        if (!formData.studentName.trim()) {
            toast.error('Please enter student name');
            return;
        }

        if (!formData.degree.trim()) {
            toast.error('Please enter degree name');
            return;
        }

        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsSubmitting(true);

        try {
            const credentialData: CredentialData = {
                studentName: formData.studentName,
                studentWallet: formData.studentWallet,
                studentEmail: formData.studentEmail || undefined,
                credentialType: formData.credentialType,
                degree: formData.degree,
                major: formData.major || undefined,
                gpa: formData.gpa || undefined,
                issueDate: formData.issueDate,
                institutionId,
                institutionName,
                institutionWallet,
                file: selectedFile,
                subjects: subjects.length > 0 ? subjects : undefined,
            };

            toast.loading('Issuing credential...', { id: 'issue-credential' });

            const result = await issueCredential(credentialData, account);

            toast.success('Credential issued successfully!', { id: 'issue-credential' });
            toast.success(`Token ID: ${result.tokenId}`, { duration: 5000 });
            toast.success(`Transaction: ${result.transactionHash.slice(0, 10)}...`, {
                duration: 5000,
            });

            // Reset form
            setFormData({
                studentName: '',
                studentWallet: '',
                studentEmail: '',
                credentialType: 'diploma',
                degree: '',
                major: '',
                gpa: '',
                issueDate: new Date().toISOString().split('T')[0],
            });
            setSelectedFile(null);
            setPreviewUrl(null);
            setSubjects([]);

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Error issuing credential:', error);
            toast.error(error.message || 'Failed to issue credential', {
                id: 'issue-credential',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-6 bg-white border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Issue New Credential</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>

                    <div>
                        <Label htmlFor="studentName">Student Name *</Label>
                        <Input
                            id="studentName"
                            placeholder="John Doe"
                            value={formData.studentName}
                            onChange={(e) =>
                                setFormData({ ...formData, studentName: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="studentWallet">Student Wallet Address *</Label>
                        <Input
                            id="studentWallet"
                            placeholder="0x..."
                            value={formData.studentWallet}
                            onChange={(e) =>
                                setFormData({ ...formData, studentWallet: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="studentEmail">Student Email (Optional)</Label>
                        <Input
                            id="studentEmail"
                            type="email"
                            placeholder="student@example.com"
                            value={formData.studentEmail}
                            onChange={(e) =>
                                setFormData({ ...formData, studentEmail: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* Credential Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Credential Details</h3>

                    <div>
                        <Label htmlFor="credentialType">Credential Type *</Label>
                        <Select
                            value={formData.credentialType}
                            onValueChange={(value) =>
                                setFormData({ ...formData, credentialType: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="diploma">Diploma</SelectItem>
                                <SelectItem value="degree">Degree Certificate</SelectItem>
                                <SelectItem value="transcript">Transcript</SelectItem>
                                <SelectItem value="certificate">Certificate</SelectItem>
                                <SelectItem value="achievement">Achievement Award</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="degree">Degree Name *</Label>
                        <Input
                            id="degree"
                            placeholder="Bachelor of Science"
                            value={formData.degree}
                            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="major">Major/Specialization (Optional)</Label>
                        <Input
                            id="major"
                            placeholder="Computer Science"
                            value={formData.major}
                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gpa">GPA (Optional)</Label>
                            <Input
                                id="gpa"
                                placeholder="3.8"
                                value={formData.gpa}
                                onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="issueDate">Issue Date *</Label>
                            <Input
                                id="issueDate"
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, issueDate: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Subject-wise Marks (Optional) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Subject-wise Marks (Optional)</h3>
                        <Button
                            type="button"
                            onClick={addSubject}
                            variant="outline"
                            size="sm"
                            className="text-teal-600 border-teal-600 hover:bg-teal-50"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Subject
                        </Button>
                    </div>

                    {subjects.length > 0 && (
                        <div className="space-y-3">
                            {subjects.map((subject, index) => (
                                <Card key={subject.id} className="p-4 bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div>
                                                <Label className="text-xs">Subject Name</Label>
                                                <Input
                                                    placeholder="Mathematics"
                                                    value={subject.name}
                                                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Marks Obtained</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="85"
                                                    value={subject.marks}
                                                    onChange={(e) => updateSubject(subject.id, 'marks', e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Max Marks</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="100"
                                                    value={subject.maxMarks}
                                                    onChange={(e) => updateSubject(subject.id, 'maxMarks', e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Grade (Optional)</Label>
                                                <Input
                                                    placeholder="A"
                                                    value={subject.grade}
                                                    onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 pt-5">
                                            <Button
                                                type="button"
                                                onClick={() => removeSubject(subject.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            {subject.marks && subject.maxMarks && (
                                                <span className="text-xs font-medium text-teal-600">
                                                    {calculatePercentage(subject.marks, subject.maxMarks)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    💡 <strong>Total Subjects:</strong> {subjects.length} |
                                    <strong className="ml-2">Average:</strong> {subjects.length > 0 && subjects.every(s => s.marks && s.maxMarks)
                                        ? (() => {
                                            const total = subjects.reduce((acc, s) => {
                                                const percentage = (parseFloat(s.marks) / parseFloat(s.maxMarks)) * 100;
                                                return acc + percentage;
                                            }, 0);
                                            return (total / subjects.length).toFixed(2) + '%';
                                        })()
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {subjects.length === 0 && (
                        <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                            <p className="text-sm text-gray-500">No subjects added yet. Click "Add Subject" to include subject-wise marks.</p>
                        </div>
                    )}
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Credential Document</h3>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
                        <input
                            type="file"
                            id="fileUpload"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="fileUpload" className="cursor-pointer">
                            <div className="flex flex-col items-center space-y-3">
                                {selectedFile ? (
                                    <>
                                        <CheckCircle2 className="h-12 w-12 text-teal-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Click to upload credential
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PDF, JPG, or PNG (max 10MB)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                            />
                        </div>
                    )}

                    {selectedFile && selectedFile.type === 'application/pdf' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="h-5 w-5" />
                            <span>PDF files will be uploaded to IPFS</span>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !selectedFile}
                        className="w-full bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Issuing Credential...
                            </>
                        ) : (
                            'Issue Credential'
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
