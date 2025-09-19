import { useState } from 'react';

const useFormValidation = (initialState, validationRules) => {
  const [formData, setFormData] = useState(initialState);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({}); // error を errors オブジェクトに変更

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // 入力時にエラーをクリアする（オプション）
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const validate = () => {
    let newErrors = {};
    let isValid = true;

    for (const field in validationRules) {
      const rule = validationRules[field];
      const value = formData[field];

      if (rule.required && (value === '' || value === null || value === undefined)) {
        newErrors[field] = `${rule.label}は必須です。`;
        isValid = false;
      } else if (rule.type === 'number' && Number.isNaN(Number(value))) { // isNaN チェックを改善
        newErrors[field] = `${rule.label}は数値を入力してください。`;
        isValid = false;
      }
      // 他のバリデーションルールがあればここに追加
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setFormData(initialState);
    setMessage('');
    setErrors({}); // エラーもリセット
  };

  return {
    formData,
    message,
    errors,
    handleChange,
    validate,
    setMessage,
    setErrors,
    resetForm,
  };
};

export default useFormValidation;
