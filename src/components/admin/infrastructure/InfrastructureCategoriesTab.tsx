import React from 'react';
import { InfrastructureCategory } from '../../../types';

interface InfrastructureCategoriesTabProps {
  categories: InfrastructureCategory[];
  isDark: boolean;
}

const InfrastructureCategoriesTab: React.FC<InfrastructureCategoriesTabProps> = ({
  categories,
  isDark
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Infrastructure Categories</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category.id} className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">{category.icon}</div>
              <div>
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {category.name}
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {category.description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Sub-categories:</strong>
              </div>
              <div className="space-y-2">
                {category.subCategories.map(sub => (
                  <div key={sub.id} className={`flex items-center justify-between p-2 rounded ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {sub.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {(sub.attributes as any)?.count || 0} items
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {category.subCategories.length} sub-categories
                </span>
                <button className={`text-xs px-3 py-1 rounded ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                } transition-colors`}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Statistics */}
      <div className={`border rounded-lg p-6 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Category Overview
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {categories.length}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Categories
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {categories.reduce((sum, cat) => sum + cat.subCategories.length, 0)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sub-categories
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {categories.reduce((sum, cat) =>
                sum + cat.subCategories.reduce((subSum, sub) =>
                  subSum + ((sub.attributes as any)?.count || 0), 0), 0
              )}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Items
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              {Math.round(categories.reduce((sum, cat) =>
                sum + cat.subCategories.reduce((subSum, sub) =>
                  subSum + ((sub.attributes as any)?.count || 0), 0), 0
              ) / categories.length)}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Avg per Category
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureCategoriesTab;