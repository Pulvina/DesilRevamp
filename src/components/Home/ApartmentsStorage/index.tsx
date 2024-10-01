import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Apartment, Floor, setUsers, updateApartment, updateFloor, addApartment } from 'redux-storage/reducers/apartments';

import { selectUsers } from 'redux-storage/selectors/apartments';
import { selectUserId } from 'redux-storage/selectors/auth';

import AddApartmentForm from './AddApartmentForm';
import FloorPlanViewer from './FloorPlanViewer';

import './styles.scss';

type ColumnType = 'string' | 'progress' | 'date';

interface Column {
  name: string;
  title: string;
  width: number;
  type: ColumnType;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="apartments-storage__progress-bar">
    <div className="apartments-storage__progress-fill" style={{ width: `${value}%` }}></div>
    <span className="apartments-storage__progress-text">{value}%</span>
  </div>
);

const ApartmentsStorage: React.FC = () => {
  const [openApartment, setOpenApartment] = useState<number | null>(null)
  const [showChat, setShowChat] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [openUser, setOpenUser] = useState<number | null>(null);

  const userId = useSelector(selectUserId)
  const users = useSelector(selectUsers)
  const dispatch = useDispatch()

  const token = localStorage.getItem('token')

  const columns: Column[] = [
    { name: 'name', title: 'Apartment', width: 150, type: 'string' },
    { name: 'client', title: 'Client', width: 80, type: 'string' },
    { name: 'createdAt', title: 'Uploaded', width: 100, type: 'date' },
    { name: 'stage', title: 'Stage', width: 100, type: 'string' },
    { name: 'progress', title: 'Progress', width: 100, type: 'progress' },
  ];

  const renderCell = (apartment: Apartment, column: Column) => {
    const value = apartment[column.name];
    switch (column.type) {
      case 'progress':
        return <ProgressBar value={value as number} />;
      case 'date':
        return new Date(value as string).toLocaleDateString();
      default:
        return value as React.ReactNode;
    }
  };

  useEffect(() => {
    const getUserApartments = async () => {
      if (token) {
        try {
          const response = await axios.get(`http://localhost:3007/api/apartments/getAll`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          dispatch(setUsers(response.data))
        } catch (error) {
          console.error('Error fetching user apartments:', error);
          throw error;
        }
      }
    };

    getUserApartments()
  }, [userId])

  const handleAddApartment = (apartmentData: Apartment, images: File[]) => {
    if (userId != null) {
      dispatch(addApartment({ userId, apartment: apartmentData }))
      setShowAddForm(false);
    }
  };

  const onOpenApartment = (apartmentId: string, index: number) => {
    if (openUser != null) {
      setOpenApartment(openApartment === index ? null : index)

      const getIcons = async () => {
        if (userId != null) {
          const response = await axios.get(`http://localhost:3007/api/apartments/${apartmentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const updatedApartment = { ...users[openUser].apartments[index] } 
          updatedApartment.floors = response.data
          dispatch(updateApartment({ userId, apartment: updatedApartment }))
        }
      }

      if (!users[openUser].apartments[index].floors) {
        getIcons()
      }
    }
  }

  const onOpenFloor = async (floor: Floor) => {
    if (openApartment != null && userId != null && openUser != null) {
      const apartmentId = users[openUser].apartments[openApartment].id

      const response = await axios.get(`http://localhost:3007/api/apartments/${apartmentId}/floors/${floor.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      dispatch(updateFloor({ userId, apartmentId, floor: response.data }))
      setSelectedFloor(response.data)
    }
  }

  return (
    <div className="users-storage__container">
      <div className="users-storage">
        <table className="users-storage__table">
          <thead>
            <tr>
              <th className="users-storage__header">Username</th>
              <th className="users-storage__header">Role</th>
              <th className="users-storage__header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, userIndex) => (
              <React.Fragment key={user.id}>
                <tr className="users-storage__row">
                  <td className="users-storage__cell">{user.username}</td>
                  <td className="users-storage__cell">{user.role_id}</td>
                  <td className="users-storage__cell">
                    <button
                      onClick={() => setOpenUser(openUser === userIndex ? null : userIndex)}
                      className="users-storage__action-button users-storage__action-button--eye"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
                {openUser === userIndex && (
                  <tr>
                    <td colSpan={3}>
                      <div className="apartments-storage">
                        <table className="apartments-storage__table">
                          <thead>
                            <tr>
                              {columns.map((column) => (
                                <th key={column.name} style={{ width: `${column.width}px` }} className="apartments-storage__header">
                                  {column.title}
                                </th>
                              ))}
                              <th className="apartments-storage__header">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {user.apartments.map((apartment, apartmentIndex) => (
                              <React.Fragment key={`${apartment.id}-${apartmentIndex}`}>
                                <tr className="apartments-storage__row">
                                  {columns.map((column) => (
                                    <td key={`${column.name}-${apartmentIndex}`} className="apartments-storage__cell">
                                      {renderCell(apartment, column)}
                                    </td>
                                  ))}
                                  <td className="apartments-storage__cell">
                                    <div className="apartments-storage__actions">
                                      <button
                                        onClick={() => onOpenApartment(apartment.id, apartmentIndex)}
                                        className="apartments-storage__action-button apartments-storage__action-button--eye"
                                      >
                                        👁️
                                      </button>
                                      <button
                                        onClick={() => setShowChat(showChat === apartmentIndex ? null : apartmentIndex)}
                                        className="apartments-storage__action-button apartments-storage__action-button--chat"
                                      >
                                        💬
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {(openApartment === apartmentIndex || showChat === apartmentIndex) && (
                                  <tr className="apartments-storage__expanded-row">
                                    <td colSpan={columns.length + 1}>
                                      {openApartment === apartmentIndex && apartment.floors && (
                                        <div className="apartments-storage__expanded-content">
                                          {apartment.floors.map(floor => (
                                            <div key={floor.id} onClick={() => onOpenFloor(floor)}>
                                              <img src={floor.icon} alt={floor.name} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {showChat === apartmentIndex && (
                                        <div className="apartments-storage__chat">
                                          Chat for {apartment.name}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
    
        {showAddForm && (
          <AddApartmentForm
            onClose={() => setShowAddForm(false)}
            onSubmit={handleAddApartment}
          />
        )}
    
        {selectedFloor && (
          <FloorPlanViewer
            floor={selectedFloor}
            onClose={() => setSelectedFloor(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ApartmentsStorage;