import axios from 'axios';
import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Apartment } from 'redux-storage/reducers/apartments';
import { selectUserId } from 'redux-storage/selectors/auth';

import './styles.scss';

interface AddApartmentFormProps {
  onClose: () => void;
  onSubmit: (projectData: Apartment, images: File[]) => void;
}

const AddApartmentForm: React.FC<AddApartmentFormProps> = ({ onClose, onSubmit }) => {
  const [newProject, setNewProject] = useState({ name: '', client: '' });
  const [images, setImages] = useState<File[]>([]);
  const [showAllImages, setShowAllImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useSelector(selectUserId);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setImages(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      const formData = new FormData();
      formData.append('name', newProject.name);
      formData.append('client', newProject.client);
      formData.append('userId', userId);
      const token = localStorage.getItem('token')
  
      images.forEach((image) => {
        formData.append('files', image);
      });
  
      try {
        const response = await axios.post('http://localhost:3007/api/apartments', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
  
        console.log(response.data)
        
        const apartment = response.data.apartment
        apartment.floors = response.data.floors

        onSubmit(apartment, images);
        onClose();
      } catch (error) {
        console.error('Error creating apartment:', error);
      } finally {
        
      }
    };
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const renderImagePreviews = () => {
    const imagesToShow = showAllImages ? images : images.slice(0, 5);
    return (
      <div className="add-apartment-form__image-previews">
        {imagesToShow.map((image, index) => (
          <div key={index} className="add-apartment-form__preview-container">
            <img
              src={URL.createObjectURL(image)}
              alt={`Preview ${index + 1}`}
              className="add-apartment-form__preview-image"
            />
            <button 
              type="button" 
              className="add-apartment-form__remove-image" 
              onClick={() => removeImage(index)}
            >
              ×
            </button>
          </div>
        ))}
        {!showAllImages && images.length > 5 && (
          <div className="add-apartment-form__more-images" onClick={() => setShowAllImages(true)}>
            +{images.length - 5}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="add-apartment-form">
      <div className="add-apartment-form__content">
        <h2 className="add-apartment-form__title">Add New Project</h2>
        <form className="add-apartment-form__form" onSubmit={handleSubmit}>
          <input
            className="add-apartment-form__input"
            type="text"
            name="name"
            value={newProject.name}
            onChange={handleInputChange}
            placeholder="Project Name"
            required
          />
          <input
            className="add-apartment-form__input"
            type="text"
            name="client"
            value={newProject.client}
            onChange={handleInputChange}
            placeholder="Client Name"
            required
          />
          <div
            className="add-apartment-form__drop-area"
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="add-apartment-form__drop-text">Drag and drop images here or</p>
            <button 
              type="button" 
              className="add-apartment-form__file-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              style={{ display: 'none' }}
              multiple
              accept="image/*"
            />
            {images.length > 0 && renderImagePreviews()}
          </div>
          <button type="submit" className="add-apartment-form__submit">Create Project</button>
          <button type="button" className="add-apartment-form__cancel" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default AddApartmentForm;