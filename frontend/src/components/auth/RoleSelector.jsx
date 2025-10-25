import React from 'react';
import { UserIcon, BuildingOfficeIcon, HeartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const RoleSelector = ({ selectedRole, onRoleSelect, roles = null }) => {
  const defaultRoles = [
    {
      id: 'hospital',
      name: 'Hospital',
      icon: BuildingOfficeIcon,
      description: 'Manage doctors and patients',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'doctor',
      name: 'Doctor',
      icon: UserIcon,
      description: 'Create and manage patient records',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'patient',
      name: 'Patient',
      icon: HeartIcon,
      description: 'Access your medical records',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const roleList = roles || defaultRoles;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Select Your Role</h3>
      <div className="grid grid-cols-1 gap-3">
        {roleList.map((role) => {
          const IconComponent = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedRole === role.id
                  ? `${role.borderColor} ${role.bgColor} ring-2 ring-offset-2 ring-current`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${role.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{role.name}</div>
                  <div className="text-sm text-gray-600">{role.description}</div>
                </div>
                {selectedRole === role.id && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
